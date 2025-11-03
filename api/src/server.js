import { AerisApplication } from "./app.js";

const app = new AerisApplication();
const port = process.env.PORT || 4000;
app.server.listen(port, () => {
  console.log(`Aeris API listening on port ${port}`);
});

export default app;
