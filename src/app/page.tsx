"use client";

import Editor from "@monaco-editor/react";
import ace from "brace";
import "jsoneditor-react/es/editor.min.css";
import { useEffect, useState } from "react";
import { useGetContentQuery } from "./redux/features/git/gitApi";

import "@contentful/forma-36-react-components/dist/styles.css";
import "brace/mode/json";
import "brace/theme/github";
import "jsoneditor-react/es/editor.min.css";

export default function Home() {
  const [json, setJson] = useState("");
  const { data, isSuccess, isLoading } = useGetContentQuery({
    owner: "tfmukles",
    repo: "hugoplate",
    path: ".zeonCms/config.json",
    parser: true,
  });

  useEffect(() => {
    if (isSuccess) {
      setJson(JSON.stringify(data.data, null, 2));
    }
  }, [isLoading, isSuccess]);

  return (
    <Editor
      className="w-[100vw] h-screen"
      mode="tree"
      history
      value={json}
      onChange={setJson}
      ace={ace}
      theme="ace/theme/github"
    />
  );
}
