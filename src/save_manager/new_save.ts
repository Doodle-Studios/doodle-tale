import {
  ASCIIFontRenderable,
  Box,
  InputRenderable,
  InputRenderableEvents,
  RGBA,
} from "@opentui/core";
import type { CliRenderer } from "@opentui/core";
import { new_data, type Data } from "./data";

export function new_save(renderer: CliRenderer): Promise<Data> {
  renderer.root.getChildren().forEach((c) => c.destroy());

  const nameinput = new InputRenderable(renderer, {
    id: "name_input",
    width: 21,
    maxLength: 16,
    backgroundColor: "transparent",
    focusedBackgroundColor: "transparent",
    textColor: "white",
    focusedTextColor: "white",
    placeholder: "enter your name",
  });

  const title = new ASCIIFontRenderable(renderer, {
    font: "tiny",
    text: "",
  });
  const titletwo = new ASCIIFontRenderable(renderer, {
    font: "tiny",
    text: "",
  });
  const titlethree = new ASCIIFontRenderable(renderer, {
    font: "tiny",
    text: "",
  });

  renderer.root.add(
    Box(
      {
        alignItems: "center",
        justifyContent: "center",
        width: "100%",
        height: "100%",
        flexDirection: "column",
        gap: 1,
      },
      Box(
        {
          alignItems: "center",
          justifyContent: "center",
          flexDirection: "column",
          gap: 1,
        },
        title,
        titletwo,
        titlethree,
      ),
      Box({ alignItems: "center", justifyContent: "center" }, nameinput),
    ),
  );

  nameinput.focus();

  const pattern = "o1o1oooo1o1ooo1111ooo1o1ooo1111ooo11oo1oo1o1o1111oo1o";
  const length = 500;
  let startIndex = 0;

  const interval = setInterval(() => {
    let result = "";
    for (let i = 0; i < length; i++) {
      const charIndex = (startIndex + i) % pattern.length;
      result += pattern[charIndex];
    }
    title.text = result;
    titletwo.text = result + "o";
    titlethree.text = result + "o1";
    startIndex = (startIndex + 1) % pattern.length;
  }, 100);

  return new Promise((resolve) => {
    nameinput.on(InputRenderableEvents.ENTER, (value) => {
      if (value.trim() === "") return;
      clearInterval(interval);
      const data = new_data(value);
      renderer.root.getChildren().forEach((c) => c.destroy());
      renderer.setCursorStyle({
        style: "block",
        blinking: true,
        color: RGBA.fromHex("#c32b2b"),
      });
      resolve(data);
    });
  });
}
