let url = window.location.origin;
const urlProtocol = window.location.host;

const domainSegment = urlProtocol.split(".")[1];
const businessAlias = urlProtocol.split("-")[0];

if (domainSegment === "vercel") {
  const env = urlProtocol.split("-")[1];

  url = `https://${businessAlias}.${env}.lendastack.io`;
}

export const environment = {
  production: true,
  apiUrl: url + "/api/",
  iasUrl: url + "/ias/v1/",
  multi: 193,
  domainSegment,
  businessAlias,
  googleAnalyticsId: 'G-1ZR9BSHVHS',
  growthbookProductionKey: 'sdk-oVQOuRNbywR6P2Zm',
  growthbookDevKey: 'sdk-S0cAz3OnqBe3ZUav',
  growthbookTestKey: 'sdk-7mx5gQdVH3MZOS4P',
  growthbookHost: 'https://cdn.growthbook.io',
};
