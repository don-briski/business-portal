const urlProtocol = window.location.host;
export const environment = {
  production: false,
  // Dev
  apiUrl: "https://" + urlProtocol.split(".")[0] + ".dev.lendastack.io/api/",
  // apiUrl: "https://" + urlProtocol.split(".")[0] + ".test.lendastack.io/api/",
  iasUrl: "https://" + urlProtocol.split(".")[0] + ".dev.lendastack.io/ias/v1/",
  // apiUrl: "https://" + urlProtocol.split(".")[0] + ".loanbookng.com/api/",
  // apiUrl: "http://" + urlProtocol.split(".")[0] + ".localhost:50005/api/",

  // Live
  // apiUrl: "https://" + urlProtocol.split(".")[0] + ".lendastack.io/api/",
  // apiUrl: "https://ae01-102-89-44-27.ngrok.io/" + "api/",
  multi: 193,
  domainSegment: '',
  businessAlias: '',
  googleAnalyticsId: 'G-1ZR9BSHVHS',
  growthbookProductionKey: 'sdk-oVQOuRNbywR6P2Zm',
  growthbookDevKey: 'sdk-S0cAz3OnqBe3ZUav',
  growthbookTestKey: 'sdk-7mx5gQdVH3MZOS4P',
  growthbookHost: 'https://cdn.growthbook.io',
};
