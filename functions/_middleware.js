// A forrásban a belső linkek .html végűek, hogy a fájlok dupla kattintással (file://) is működjenek.
// Élesben ezeket itt, a kiszolgáláskor tiszta címre írjuk át, így a Google nem átirányító címeket talál.
const BELSO = /^(?!https?:|\/\/|mailto:|tel:|#|javascript:)([^?#]*?)(index)?\.html([?#].*)?$/i;

function tisztit(href) {
  const m = BELSO.exec(href);
  if (!m) return null;
  const ut = m[1] || "";
  const vege = m[3] || "";
  if (m[2]) {
    // index.html → ./ , ../index.html → ../ , mappa/index.html → mappa/
    return (ut === "" ? "./" : ut) + vege;
  }
  return ut + vege;
}

class LinkTisztito {
  element(el) {
    const href = el.getAttribute("href");
    if (!href) return;
    const uj = tisztit(href.trim());
    if (uj !== null && uj !== href) el.setAttribute("href", uj);
  }
}

export async function onRequest(context) {
  const url = new URL(context.request.url);
  if (url.hostname === "www.ideahome.hu") {
    url.hostname = "ideahome.hu";
    return Response.redirect(url.toString(), 301);
  }
  const valasz = await context.next();
  const tipus = valasz.headers.get("content-type") || "";
  if (!tipus.includes("text/html")) return valasz;
  return new HTMLRewriter().on("a[href]", new LinkTisztito()).transform(valasz);
}
