import { Endpoints } from "@octokit/types";

export type GitHubEndpoint = keyof Endpoints;
export type GitHubPromise<E extends GitHubEndpoint> =
  Endpoints[E]["response"]["data"];
export type GitHubOption<E extends GitHubEndpoint> =
  Endpoints[E]["parameters"] & { parser?: boolean };
