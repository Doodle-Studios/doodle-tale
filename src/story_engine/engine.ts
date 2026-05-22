import { BoxRenderable, CliRenderer, MarkdownRenderable, SyntaxStyle } from "@opentui/core";
import {type Section} from "./parser";

export function render_dialogue(section: Section, renderer: CliRenderer) {

  async function typewriter(content: string) {
    for (let i = 0; i < content.length; i++) {
      dialogue_text.content += content[i];
    }
  }

  renderer.requestLive();
  renderer.root.getChildren().forEach(c => c.destroy());
  
  var dialogue_box = new BoxRenderable(renderer, { 
    width: 20,
    height: 30,
    border: true,
    borderStyle: "rounded",
    alignSelf: "baseline",
    justifyContent: "center",
    alignItems: "center",
    margin: 2,
  })

  var style = SyntaxStyle.fromStyles({})
  
  var dialogue_text = new MarkdownRenderable(renderer, {
    content: "",
    syntaxStyle: style,
  })
  dialogue_box.add(dialogue_text)

  renderer.root.add(dialogue_box)  
}