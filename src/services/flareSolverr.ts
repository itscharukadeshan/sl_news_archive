/** @format */
import axios from "axios";
import { FLARESOLVERR_URL } from "../config";

interface FlareSolverrResponse {
  solution: {
    url: string;
    cookies: { name: string; value: string; domain: string }[];
  };
}

export const getFlareSolverrCookies = async (url: string) => {
  try {
    console.log(`Requesting Cloudflare bypass for: ${url}`);

    const response = await axios.post<FlareSolverrResponse>(FLARESOLVERR_URL, {
      cmd: "request.get",
      url,
      maxTimeout: 60000,
    });

    if (!response.data.solution || !response.data.solution.url) {
      throw new Error("FlareSolverr failed to return a solution.");
    }

    return {
      solvedUrl: response.data.solution.url,
      cookies: response.data.solution.cookies,
    };
  } catch (error) {
    console.error("Error while solving Cloudflare with FlareSolverr:", error);
    throw error;
  }
};

export default getFlareSolverrCookies;
