import { handleProxy } from "./handler";

export default {
  fetch(request: Request): Promise<Response> {
    return handleProxy(request);
  },
};
