import {
  ASCIIFont,
  Box,
  SelectRenderable,
  SelectRenderableEvents,
} from "@opentui/core";
import type { CliRenderer } from "@opentui/core";
import * as data from "./loader";
import { readdir } from "node:fs/promises";
import path from "node:path";

export async function directory_vis(
  renderer: CliRenderer,
  dir: string,
): Promise<Dict<any> | null> {
  renderer.root.getChildren().forEach((c) => c.destroy());

  const fileselector = new SelectRenderable(renderer, {
    id: "file_selector",
    width: 30,
    height: "100%",
    itemSpacing: 1,
    selectedTextColor: "lime",
    options: [],
  });

  const exit_selector = new SelectRenderable(renderer, {
    id: "exit_selector",
    width: 30,
    height: "100%",
    itemSpacing: 1,
    selectedTextColor: "red",
    selectedBackgroundColor: "transparent",
    options: [
      { name: "EXIT", description: "Exit out of program" },
    ],
    marginLeft: 2,
  });

  exit_selector.on(SelectRenderableEvents.ITEM_SELECTED, (_index, option) => {
    if (option.name === "EXIT") {
      renderer.destroy();
      process.exit(0);
    }
  });

  fileselector.focus();
  fileselector.options.push({ name: "←—", description: "Go Back" });

  const files = await readdir(dir);
  for (const file of files) {
    if (file.endsWith(".save")) {
      fileselector.options.push({
        name: "💾 " + file,
        description: "save file",
      });
    } else if (!file.includes(".")) {
      fileselector.options.push({
        name: "📂 " + file + "/",
        description: "directory",
      });
    }
  }

  renderer.root.add(
    Box(
      { width: "100%", height: "100%", margin: 2, flexDirection: "row" },
      fileselector,
      exit_selector,
    ),
  );

  return new Promise((resolve) => {
    fileselector.on(
      SelectRenderableEvents.ITEM_SELECTED,
      async (_index, option) => {
        if (option.name === "←—") {
          renderer.root.getChildren().forEach((c) => c.destroy());
          resolve(directory_vis(renderer, path.dirname(dir)));
        } else if (option.name.endsWith(".save")) {
          const fileName = option.name.replace(/^.+?\s/, "");
          const save_data = await data.load(path.join(dir, fileName));
          if (save_data == null) {
            if (renderer.root.getRenderable("error")) return;
            renderer.root.add(
              Box(
                {
                  id: "error",
                  width: "100%",
                  height: 10,
                  alignItems: "baseline",
                  justifyContent: "center",
                  position: "absolute",
                  bottom: 0,
                  left: 0,
                },
                ASCIIFont({ font: "tiny", text: "Error loading save file" }),
              ),
            );
            setTimeout(() => {
              renderer.root.remove("error");
            }, 500);
          } else {
            renderer.root.getChildren().forEach((c) => c.destroy());
            resolve(save_data);
          }
        } else if (option.name.endsWith("/")) {
          const cleanDirName = option.name
            .replace(/^.+?\s/, "")
            .replace("/", "");
          resolve(directory_vis(renderer, path.join(dir, cleanDirName)));
        }
      },
    );
  });
}
