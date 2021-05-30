import { randomInt } from 'crypto';

import { Client, Constants, Intents } from 'discord.js';


const config = {
  dice: {
    maxCount: 99,
    minSides: 2,
    maxSides: 9999,
    maxRolls: 5
  },
  status: {
    maxLength: 20
  }
};

const client = new Client({
  allowedMentions: { repliedUser: false },
  intents: Intents.NON_PRIVILEGED
});

const commands = {
  dice(message: string) {
    const parseRoll = function(rollString: string) {
      const match = rollString.match(/^(\d+)?d(\d+)$/);
      if (match === null)
        return false;

      let diceCount = Number(match[1]);
      const dieSides = Number(match[2]);

      if (Number.isNaN(diceCount))
        diceCount = 1;
      else if (diceCount < 1 || diceCount > config.dice.maxCount)
        return false;
      if (Number.isNaN(dieSides)
          || dieSides < config.dice.minSides
          || dieSides > config.dice.maxSides)
        return false;

      const rolls = [];
      let total = 0;
      for (let i = 0; i < diceCount; ++i) {
        const roll = randomInt(dieSides) + 1;
        rolls.push(roll);
        total += roll;
      }

      let meme = '';
      if (rollString === '2d6' && total === 2)
        meme = ' :snake::eyes:';

      if (diceCount > 1)
        return `${rollString}: ${rolls.join(' + ')} = **${total}**${meme}`;
      else
        return `${rollString}: **${total}**${meme}`;
    };

    const regex = /^((\d+)?d\d+)($|\s|\+)/;
    const rolls = [];
    let match, count = 0;

    if (message.startsWith('!'))
      message = message.substr(1);

    while ((match = message.match(regex)) !== null) {
      if (count >= config.dice.maxRolls) {
        rolls.push(`I can\u2019t remember more than ${config.dice.maxRolls} rolls at a time!`);
        break;
      }
      const roll = parseRoll(match[1]);
      if (roll !== null)
        rolls.push(roll);
      message = message.substr(match[1].length);
      if (message.startsWith('+')) {
        if (message.substr(1).match(regex) === null)
          return null;
        message = message.substr(1);
      }
      ++count;
    }
    if (rolls.length === 0)
      return false;
    else if (rolls.length === 1)
      return rolls[0];
    else
      return `Rolls:\n${rolls.join('\n')}`;
  },
  status(message: string) {
    if (!client.user || !message.match(/^!status\b/))
      return false;

    const matchClear = message.match(/^!status\s+clear\s*$/);
    if (matchClear) {
      return "Can\u2019t clear status right now, sorry";
      //client.user.setActivity();
      //return true;
    }

    const match = message.match(/^!status\s+(playing|watching|listening)\s+(\S.*)$/);
    if (!match)
      return "Correct format: `!status [ clear | [ playing | watching | listening ] whatever ]`";
    if (match[2].length > config.status.maxLength)
      return `Subject cannot be over ${config.status.maxLength} characters long.`;
    const type = (Constants.ActivityTypes as string[]).indexOf(match[1].toUpperCase());
    client.user.setActivity(match[2], { type });
    return true;
  }
};

client.on('message', async message => {
  if (message.author.bot)
    return;

  for (const command of Object.values(commands)) {
    const reply = command(message.content);
    if (reply) {
      if (typeof reply === 'string') {
        try {
          await message.reply(reply);
        } catch (error) {
          console.log(error);
        }
      }
      return;
    }
  }
});

client.login();
