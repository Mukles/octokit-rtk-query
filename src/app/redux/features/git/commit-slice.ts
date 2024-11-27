import { githubApi } from "./gitApi";
import { GitHubOption, GitHubPromise } from "./type"; // import necessary types

function checkMedia(path: string) {
  return path.endsWith(".md") || path.endsWith(".mdx");
}

export const commitApi = githubApi.injectEndpoints({
  endpoints: (builder) => ({
    getUser: builder.query<
      GitHubPromise<"GET /user">,
      GitHubOption<"GET /user">
    >({
      query: () => ({
        endpoint: "GET /user",
        options: {},
      }),
    }),

    getBranchRef: builder.query<
      GitHubPromise<"GET /repos/{owner}/{repo}/git/ref/{ref}">,
      GitHubOption<"GET /repos/{owner}/{repo}/git/ref/{ref}">
    >({
      query: ({ owner, repo, ref }) => ({
        endpoint: "GET /repos/{owner}/{repo}/git/ref/{ref}",
        options: { owner, repo, ref },
      }),
    }),

    createBlob: builder.mutation<
      GitHubPromise<"POST /repos/{owner}/{repo}/git/blobs">,
      GitHubOption<"POST /repos/{owner}/{repo}/git/blobs">
    >({
      query: ({ owner, repo }) => ({
        endpoint: "POST /repos/{owner}/{repo}/git/blobs",
        options: { owner, repo },
      }),
    }),

    createTree: builder.mutation<
      GitHubPromise<"POST /repos/{owner}/{repo}/git/trees">,
      GitHubOption<"POST /repos/{owner}/{repo}/git/trees">
    >({
      query: ({ owner, repo, tree, base_tree }) => ({
        endpoint: "POST /repos/{owner}/{repo}/git/trees",
        options: { owner, repo, tree, base_tree },
      }),
    }),

    createCommit: builder.mutation<
      GitHubPromise<"POST /repos/{owner}/{repo}/git/commits">,
      GitHubOption<"POST /repos/{owner}/{repo}/git/commits">
    >({
      query: ({ owner, repo }) => {
        return {
          endpoint: "POST /repos/{owner}/{repo}/git/commits",
          options: { owner, repo, message: "Initial commit" },
        };
      },
    }),

    pushChanges: builder.mutation<
      GitHubPromise<"PATCH /repos/{owner}/{repo}/git/refs/{ref}">,
      GitHubOption<"PATCH /repos/{owner}/{repo}/git/refs/{ref}">
    >({
      query: ({ owner, repo, ref, sha }) => ({
        endpoint: "PATCH /repos/{owner}/{repo}/git/refs/{ref}",
        options: { owner, repo, sha, ref },
      }),
    }),

    updateFiles: builder.mutation<
      GitHubPromise<"POST /repos/{owner}/{repo}/git/commits">,
      GitHubOption<"POST /repos/{owner}/{repo}/git/commits">
    >({
      async queryFn({ owner, repo, files, message, description, token }, 
      
        try {
          // 1. Fetch the current branch reference
          const { data: branchRef } = await fetchWithBQ({
            url: `/repos/${owner}/${repo}/git/ref/heads/${repo}`,
            headers: { Authorization: `Bearer ${token}` },
          });

          const parents = branchRef.object.sha;

          // 2. Create blobs for each file
          const blobs = await Promise.all(
            files.map(async (file) =>
              fetchWithBQ({
                url: `/repos/${owner}/${repo}/git/blobs`,
                method: "POST",
                headers: { Authorization: `Bearer ${token}` },
                body: {
                  content: file.content,
                  ...(checkMedia(file.path) && file.content && { encoding: "base64" }),
                },
              })
            )
          );

          // 3. Create tree object using blobs
          const treeData = blobs.map((blob: any, index: number) => ({
            path: files[index].path,
            type: "blob",
            mode: "100644",
            sha: blob.data.sha,
          }));

          // 4. Create the tree using the created blobs
          const { data: tree } = await fetchWithBQ({
            url: `/repos/${owner}/${repo}/git/trees`,
            method: "POST",
            headers: { Authorization: `Bearer ${token}` },
            body: { tree: treeData, base_tree: parents },
          });

          // 5. Create commit with the tree object
          const commitResponse = await fetchWithBQ({
            url: `/repos/${owner}/${repo}/git/commits`,
            method: "POST",
            headers: { Authorization: `Bearer ${token}` },
            body: {
              message,
              tree: tree.sha,
              parents: [parents],
              ...(description && { description }),
            },
          });

          // 6. Push the commit reference to the repository
          await fetchWithBQ({
            url: `/repos/${owner}/${repo}/git/refs/heads/${repo}`,
            method: "PATCH",
            headers: { Authorization: `Bearer ${token}` },
            body: { sha: commitResponse.sha, force: true },
          });

          return { data: commitResponse };
        } catch (err) {
          return { error: err };
        }
      },
    }),
  }),
});
