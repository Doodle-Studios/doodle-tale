import {
  ASCIIFont,
  ASCIIFontRenderable,
  Box,
  createCliRenderer,
  Input,
  InputRenderable,
  InputRenderableEvents,
  RGBA,
  SelectRenderable,
  SelectRenderableEvents,
  Text,
  TextAttributes
} from "@opentui/core";
import * as data from "./save_schema/loader"
import {readdir} from "node:fs/promises";
import { Data, new_data } from "./save_schema/data";

const renderer = await createCliRenderer({ exitOnCtrlC: true});
function shutdown(err:string) {
  renderer.destroy();
  console.error(err);
  process.exit(1);
}

process.on("uncaughtException", shutdown);
process.on("unhandledRejection", shutdown);

async function directory_vis(dir: string) : Promise<Dict<any> | null> {
  renderer.root.getChildren().forEach(c => c.destroy());

  var fileselector = new SelectRenderable(renderer, {
    id: "file_selector",
    width: 25,
    height: "100%",
    itemSpacing: 1,
    focusedBackgroundColor: "transparent",
    selectedTextColor: "lime",
    options: []
  })

  var exit_selector = new SelectRenderable(renderer, {
    alignSelf: "flex-end",
    id: "exit_selector",
    width: 25,
    height: 3,
    itemSpacing: 1,
    focusedBackgroundColor: "white",
    selectedTextColor: "red",
    selectedBackgroundColor: "transparent",
    options: [
      { name: "EXIT", description: "Exit out of program" }
    ]
  })

  exit_selector.on(SelectRenderableEvents.ITEM_SELECTED, (index, option) => {
    if (option.name == "EXIT") {
      renderer.destroy();
      process.exit(0);
    }
  })


  fileselector.focus();
  fileselector.options.push({ name: "←—", description: "Go Back" });
  
  const files = await readdir(dir);

  for (const file of files) {
    if (file.endsWith(".save")) {
      fileselector.options.push({ name: file, description: "Save File" });
    } else if (!file.includes(".")) {
      fileselector.options.push({ name: file + "/", description: "Directory" });
    }
  }

  renderer.root.add(
    Box({width: "100%", height: "100%", margin:2},
      fileselector,
      exit_selector
    )
  )

  return new Promise((resolve) => {
    fileselector.on(SelectRenderableEvents.ITEM_SELECTED, async (index, option) => {
      
      if (option.name == "←—") {
        resolve(directory_vis(dir.split("/").slice(0, -1).join("/")));
        renderer.root.getChildren().forEach(c => c.destroy());
      } else if (option.name.endsWith(".save")) {
        const save_data = await data.load(`${dir}/${option.name}`);
        if (save_data == null) {
          renderer.root.add(
            Box({id: "error", width: "100%", height: 10, alignItems: "baseline", justifyContent: "center"},
              ASCIIFont({font: "tiny", text: "Error loading save file"})
            )
          )
          setTimeout(() => {
            renderer.root.remove("error")
          }, 500);
        } else {
          renderer.root.getChildren().forEach(c => c.destroy());
          resolve(save_data); 

        }
      } else if (!option.name.includes(".")) {
        const cleanDirName = option.name.replace("/", "");
        resolve(directory_vis(`${dir}/${cleanDirName}`));
      }
    });
  });
}

class Game {
  data: Data  | undefined;
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
        { name: "Quit", description: "Exit the game" }
      ]
    });
    
    selector.on(SelectRenderableEvents.ITEM_SELECTED, async (index, option)=>{
      if (option.name == "Quit") {
        renderer.destroy();
        process.exit(0);
      } else if (option.name == "New Game") {
        renderer.root.getChildren().forEach(c => c.destroy());
        var nameinput = new InputRenderable(renderer, {
          id: "name_input",
          width: 21,
          maxLength: 16,
          backgroundColor: "transparent", 
          focusedBackgroundColor: "transparent",
          textColor: "white",
          focusedTextColor: "white",
          placeholder: "enter your name",
        });

        var title = new ASCIIFontRenderable(renderer, {font: "tiny", text: ""});
        var titletwo = new ASCIIFontRenderable(renderer, {font: "tiny", text: ""});
        var titlethree = new ASCIIFontRenderable(renderer, {font: "tiny", text: ""});
        renderer.root.add(
          Box({alignItems: "center", justifyContent: "center", width: "100%", height: "100%", flexDirection: "column", gap:1},
            Box({alignItems: "center", justifyContent: "center", flexDirection:"column", gap:1},
              title,
              titletwo,
              titlethree
            ),
            Box({alignItems: "center", justifyContent: "center"},
              nameinput
            )
          )
        )

        var name = "";
        nameinput.on(InputRenderableEvents.CHANGE, (value) => {
          name = value;
        });

        nameinput.on(InputRenderableEvents.ENTER, (value) => {
          if (value.trim() == "") return;
          this.data = new_data(value);
          renderer.root.getChildren().forEach(c => c.destroy());
          renderer.setCursorStyle({
            style: "block",
            blinking: true,
            color: RGBA.fromHex("#c32b2b"),
          })
          setTimeout(() => {
            renderer.destroy();
            process.exit(0);
          }, 2000)
        });

        nameinput.focus();
        const pattern = "o1o1oooo1o1ooo1111ooo1o1ooo1111ooo11oo1oo1o1o1111oo1o"
        const length = 500; // Total characters to display at once
        let startIndex = 0;

        setInterval(() => {
          let result = "";
          
          for (let i = 0; i < length; i++) {
            const charIndex = (startIndex + i) % pattern.length;
            result += pattern[charIndex];
          }
          
          title.text = result;
          titletwo.text = result+"o";
          titlethree.text = result+"o1"
          startIndex = (startIndex + 1) % pattern.length;

        }, 100);


      } else if (option.name == "Load Game") {
        const loaded_data = await directory_vis(import.meta.dir);
        if (loaded_data != null) {
          this.data = new Data(loaded_data);
          if (!this.data.valid){
            this.data = new_data("Player");
          } 
          process.exit(0);
        } else {
          renderer.destroy();
          process.exit(0);
        }
      }
    })

    selector.focus();

    renderer.root.add(
      Box({alignItems: "center", justifyContent: "center", width: "100%", height: "100%"},
        Box({alignItems: "center", justifyContent: "center"},
          ASCIIFont({font: "slick", text: "Doodle Tale"}),
          Text({content: "v0.1.5", attributes: TextAttributes.DIM, alignSelf: "flex-end"})
        ),
        Box({alignItems: "center", justifyContent: "center", paddingTop: 2},
          selector
        )
      )
    )
  }
}

var game = new Game();
game.start();