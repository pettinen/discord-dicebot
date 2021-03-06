import {randomInt} from "crypto";

import {Client, Constants, Intents} from "discord.js";


const config = {
  dice: {
    maxCount: 99,
    minSides: 2,
    maxSides: 9999,
    maxRolls: 5,
  },
  status: {
    maxLength: 20,
  },
};

const client = new Client({
  allowedMentions: {repliedUser: false},
  intents: Intents.NON_PRIVILEGED,
});

const commands = {
  dice(message: string): string | boolean {
    const parseRoll = function(rollString: string): string | null {
      const match = /^(\d+)?d(\d+)$/u.exec(rollString);
      if (match === null)
        return null;

      let diceCount = Number(match[1]);
      const dieSides = Number(match[2]);

      if (Number.isNaN(diceCount))
        diceCount = 1;
      else if (diceCount < 1 || diceCount > config.dice.maxCount)
        return null;
      if (Number.isNaN(dieSides)
          || dieSides < config.dice.minSides
          || dieSides > config.dice.maxSides)
        return null;

      const rolls = [];
      let total = 0;
      for (let i = 0; i < diceCount; ++i) {
        const roll = randomInt(dieSides) + 1;
        rolls.push(roll);
        total += roll;
      }

      let meme = "";
      if (rollString === "2d6" && total === 2)
        meme = " :snake::eyes:";

      if (diceCount > 1)
        return `${rollString}: ${rolls.join(" + ")} = **${total}**${meme}`;
      else
        return `${rollString}: **${total}**${meme}`;
    };

    const regex = /^((\d+)?d\d+)($|\s|\+)/u;
    const rolls = [];
    let match, count = 0;

    if (message.startsWith("!"))
      message = message.substr(1);

    while ((match = regex.exec(message)) !== null) {
      if (count >= config.dice.maxRolls) {
        rolls.push(`I can\u2019t remember more than ${config.dice.maxRolls} rolls at a time!`);
        break;
      }
      const roll = parseRoll(match[1]);
      if (roll !== null)
        rolls.push(roll);
      message = message.substr(match[1].length);
      if (message.startsWith("+")) {
        if (regex.exec(message.substr(1)) === null)
          return true;
        message = message.substr(1);
      }
      ++count;
    }
    if (rolls.length === 0)
      return false;
    else if (rolls.length === 1)
      return rolls[0];
    else
      return `Rolls:\n${rolls.join("\n")}`;
  },
  status(message: string): string | boolean {
    if (!client.user || !/^!status\b/u.exec(message))
      return false;

    const matchClear = /^!status\s+clear\s*$/u.exec(message);
    if (matchClear) {
      client.user.setPresence({activities: []});
      return true;
    }

    const match = /^!status\s+(playing|watching|listening)\s+(\S.*)$/u.exec(message);
    if (!match)
      return "Correct format: `!status [ clear | [ playing | watching | listening ] whatever ]`";
    if (match[2].length > config.status.maxLength)
      return `Subject cannot be over ${config.status.maxLength} characters long.`;
    const type = (Constants.ActivityTypes as string[]).indexOf(match[1].toUpperCase());
    client.user.setActivity(match[2], {type});
    return true;
  },
};

client.on("message", async message => {
  if (message.author.bot || !client.user)
    return;

  const botMention = `<@!${client.user.id}>`;
  let content = message.content.trim();
  if (content.startsWith(botMention))
    content = content.slice(botMention.length).trim();

  for (const command of Object.values(commands)) {
    const reply = command(content);
    if (reply) {
      if (typeof reply === "string") {
        try {
          await message.reply(reply);
        } catch (error: unknown) {
          console.log(error);
        }
      }
      return;
    }
  }
});

client.login().catch(console.log);
