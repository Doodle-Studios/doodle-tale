# intro
You wake up in a small village. The air smells of pine and smoke.
A traveller approaches you. "Ah, \Echaracter.name\! Just the person I was looking for."
\P
"You look like you're in good health — \Scharacter.hp\ out of \Scharacter.max_hp\ HP. Good."
What do you do?
- Ask what he wants
- Ignore him and walk away

# ask
"There's a beast in the forest to the north," he says, eyes wide.
"Only someone with \Echaracter.name\'s strength could deal with it. And you have \Scharacter.stats.strength\ strength to prove it."
- Head to the forest
- Refuse the quest

# ignore
You brush past him. He calls after you, but you don't look back.
The village square is quiet. Somewhere, a dog barks.
- Head to the forest anyway
- Visit the tavern

# forest
The trees close in around you. It is very dark.
\P
Somewhere ahead, something growls.
- Fight the beast
- Turn back

# refuse
"I understand," the traveller says, looking defeated.
"But if you change your mind, the forest is to the north."
- Head to the forest
- Visit the tavern

# tavern
The tavern is warm and loud. Someone is playing a lute badly.
The barkeep nods at you. "\Echaracter.name\, the usual?"
- Order a drink
- Ask about the forest

# order_drink
You sit down with a mug of something strong.
For now, the troubles of the world can wait.

# ask_about_forest
"Strange things have been happening up there," the barkeep mutters.
"I wouldn't go alone if I were you."
- Head to the forest
- Stay in the tavern

# fight_beast
You draw your weapon. \Echaracter.fight\
Your equipped weapon has \Scharacter.weapons.equipped\ power.
The beast lunges. The fight begins.

# turn_back
You decide discretion is the better part of valour.
You head back to the village, heart still pounding.
- Visit the tavern
- Rest at the inn
