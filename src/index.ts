import {
  ASCIIFont,
  Box,
  createCliRenderer,
  SelectRenderable,
  SelectRenderableEvents,
  Text,
  TextAttributes,
} from "@opentui/core";
import path from "node:path";
import { Data, new_data } from "./save_manager/data";
import { directory_vis } from "./save_manager/directory_vis";
import { new_save } from "./save_manager/new_save";

const renderer = await createCliRenderer({ exitOnCtrlC: true });

function shutdown(err: unknown) {
  renderer.destroy();
  console.error(err);
  process.exit(1);
}

process.on("uncaughtException", shutdown);
process.on("unhandledRejection", shutdown);

class Game {
  data: Data | undefined;

  start() {
    const selector = new SelectRenderable(renderer, {
      id: "start-menu",
      width: 25,
      height: 10,
      itemSpacing: 1,
      backgroundColor: "transparent",
      focusedBackgroundColor: "transparent",
      selectedTextColor: "lime", 
      selectedBackgroundColor: "transparent",
      options: [
        { name: "New Game", description: "Start a new save" },
        { name: "Load Game", description: "Load an existing save" },
        { name: "Quit", description: "Exit the game" },
      ],
    });

    selector.on(
      SelectRenderableEvents.ITEM_SELECTED,
      async (_index, option) => {
        if (option.name === "Quit") {
          renderer.destroy();
          process.exit(0);
        } else if (option.name === "New Game") {
          this.data = await new_save(renderer);
          setTimeout(() => {
            renderer.destroy();
            process.exit(0);
          }, 2000);
        } else if (option.name === "Load Game") {
          const loaded_data = await directory_vis(renderer, import.meta.dir);
          if (loaded_data != null) {
            this.data = new Data(loaded_data);
            if (!this.data.valid) {
              renderer.root.add(ASCIIFont({
                text: "error loading file",
                font:"block"
              }))
              setTimeout(() => {
                renderer.destroy();
                process.exit(0);
              }, 2000);
            } else {
              renderer.destroy()
              process.exit(0);
            }
          } else {
            renderer.destroy();
            process.exit(0);
          }
        }
      },
    );

    selector.focus();

    renderer.root.add(
      Box(
        {
          alignItems: "center",
          justifyContent: "center",
          width: "100%",
          height: "100%",
        },
        Box(
          { alignItems: "center", justifyContent: "center" },
          ASCIIFont({ font: "slick", text: "Doodle Tale" }),
          Text({
            content: "v0.1.5",
            attributes: TextAttributes.DIM,
            alignSelf: "flex-end",
          }),
        ),
        Box(
          { alignItems: "center", justifyContent: "center", paddingTop: 2 },
          selector,
        ),
      ),
    );
  }
}

const game = new Game();
game.start();
