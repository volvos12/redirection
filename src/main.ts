import {
  generateShortCode,
  getClickEvent,
  getShortLink,
  getUserLinks,
  incrementClickCount,
  storeShortLink,
  watchShortLink,
} from "./db.ts";
import { Router } from "./router.ts";
import { render } from "npm:preact-render-to-string";
import {
  CreateShortlinkPage,
  HomePage,
  LinksPage,
  NotFoundPage,
  ShortlinkViewPage,
} from "./ui.tsx";
import { serveDir } from "@std/http";

const app = new Router();


app.get("/", () => {
  return new Response(
    render(HomePage()),
    {
      status: 200,
      headers: {
        "content-type": "text/html",
      },
    },
  );
});

app.get("/links/new", (_req) => {

  return new Response(render(CreateShortlinkPage()), {
    status: 200,
    headers: {
      "content-type": "text/html",
    },
  });
});

app.get("/links/:id", async (_req, _info, params) => {
  const shortCode = params.pathname.groups["id"];
  const shortLink = await getShortLink(shortCode);

  return new Response(render(ShortlinkViewPage({ shortLink })), {
    status: 200,
    headers: {
      "content-type": "text/html",
    },
  });
});

app.get("/links", async () => {

  const shortLinks = await getUserLinks("public");

  return new Response(render(LinksPage({ shortLinkList: shortLinks })), {
    status: 200,
    headers: {
      "content-type": "text/html",
    },
  });
});

app.post("/links", async (req) => {

  // Parse form data
  const formData = await req.formData();
  const longUrl = formData.get("longUrl") as string;

  if (!longUrl) {
    return new Response("Missing longUrl", { status: 400 });
  }

  const shortCode = await generateShortCode(longUrl);
  await storeShortLink(longUrl, shortCode, "public");

  // Redirect to the links list page after successful creation
  return new Response(null, {
    status: 303,
    headers: {
      "Location": "/links",
    },
  });
});

app.get("/links/:id", async (_req, _info, params) => {

  const shortCode = params?.pathname.groups["id"];
  const shortLink = await getShortLink(shortCode!);

  return new Response(render(ShortlinkViewPage({ shortLink })), {
    status: 200,
    headers: {
      "content-type": "text/html",
    },
  });
});

app.get("/realtime/:id", (_req, _info, params) => {
  const shortCode = params?.pathname.groups["id"];

  const stream = watchShortLink(shortCode!);

  const body = new ReadableStream({
    async start(controller) {
      while (true) {
        const { done } = await stream.read();
        if (done) {
          return;
        }

        const shortLink = await getShortLink(shortCode);
        const clickAnalytics = shortLink.clickCount > 0 &&
          await getClickEvent(shortCode, shortLink.clickCount);

        controller.enqueue(
          new TextEncoder().encode(
            `data: ${
              JSON.stringify({
                clickCount: shortLink.clickCount,
                clickAnalytics,
              })
            }\n\n`,
          ),
        );
        console.log("Stream updated");
      }
    },
    cancel() {
      stream.cancel();
    },
  });

  return new Response(body, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      "Connection": "keep-alive",
    },
  });
});

app.get("/:id", async (req, _info, params) => {
  const shortCode = params.pathname.groups["id"];
  const shortLink = await getShortLink(shortCode);

  if (shortLink) {
    // Capture analytics data
    const ipAddress = req.headers.get("x-forwarded-for") ||
      req.headers.get("cf-connecting-ip") || "Unknown";
    const userAgent = req.headers.get("user-agent") || "Unknown";
    const country = req.headers.get("cf-ipcountry") || "Unknown";

    // Increment click count and store analytics data
    await incrementClickCount(shortCode, {
      ipAddress,
      userAgent,
      country,
    });

    // Redirect to the long URL
    return new Response(null, {
      status: 303,
      headers: {
        "Location": shortLink.longUrl,
      },
    });
  } else {
    // Render 404 page
    return new Response(render(NotFoundPage({ shortCode })), {
      status: 404,
      headers: {
        "Content-Type": "text/html",
      },
    });
  }
});

// Static Assets
app.get("/static/*", (req) => serveDir(req));

export default {
  fetch(req) {
    return app.handler(req);
  },
} satisfies Deno.ServeDefaultExport;
