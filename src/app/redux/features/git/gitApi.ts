import { parseContentJson } from "@/app/lib/content-parser";
import { fmDetector } from "@/app/lib/fm-detector";
import { Octokit } from "@octokit/rest";
import { BaseQueryFn } from "@reduxjs/toolkit/query";
import { createApi } from "@reduxjs/toolkit/query/react";
import path from "path";
import { GitHubEndpoint, GitHubOption, GitHubPromise } from "./type";

// Initialize Octokit instance
const octokit = new Octokit({
  auth: process.env.GITHUB_PERSONAL_TOKEN,
});

// Custom baseQuery for Octokit
export const octokitBaseQuery: BaseQueryFn<
  {
    endpoint: GitHubEndpoint;
    options: GitHubOption<GitHubEndpoint>;
  },
  unknown,
  { status: number; data: string } // Error type
> = async ({ endpoint, options }) => {
  try {
    const response = await octokit.request(endpoint, options);
    return { data: response.data };
  } catch (error: any) {
    return {
      error: {
        status: error.status || 500,
        data: error.message,
      },
    };
  }
};

// Create RTK Query API slice
export const githubApi = createApi({
  reducerPath: "githubApi",
  baseQuery: octokitBaseQuery,

  endpoints: (builder) => ({
    // Example: Fetch user repositories
    getUserRepos: builder.query<
      GitHubPromise<"GET /users/{username}/repos">,
      GitHubOption<"GET /users/{username}/repos">
    >({
      query: ({ username }) => ({
        endpoint: "GET /users/{username}/repos",
        options: { username },
      }),
    }),

    getContent: builder.query<
      GitHubPromise<"GET /repos/{owner}/{repo}/contents/{path}">,
      GitHubOption<"GET /repos/{owner}/{repo}/contents/{path}">
    >({
      query: ({ owner, repo, path }) => ({
        endpoint: "GET /repos/{owner}/{repo}/contents/{path}",
        options: { owner, repo, path },
      }),
      transformResponse(
        baseQueryReturnValue: GitHubPromise<"GET /repos/{owner}/{repo}/contents/{path}">,
        meta,
        arg: GitHubOption<"GET /repos/{owner}/{repo}/contents/{path}">
      ) {
        // Handle different types of responses
        if (Array.isArray(baseQueryReturnValue)) {
          // It's a directory listing, return as is
          return baseQueryReturnValue;
        } else if (
          typeof baseQueryReturnValue === "object" &&
          baseQueryReturnValue.type === "file" &&
          "content" in baseQueryReturnValue &&
          baseQueryReturnValue.content
        ) {
          const { parser } = arg;
          // Decode content if it's a file with base64 content
          const decodedContent = Buffer.from(
            baseQueryReturnValue.content,
            "base64"
          ).toString("utf-8");

          if (parser) {
            const fm = fmDetector(decodedContent, path.parse(arg.path).ext);

            const parsedContent = parseContentJson(decodedContent, fm);
            return { ...parsedContent, fmType: fm };
          }
        }
        // Return other types as is (e.g., submodules or symlinks)
        return baseQueryReturnValue;
      },
    }),
  }),
});

// Export hooks
export const { useGetUserReposQuery, useGetContentQuery } = githubApi;
