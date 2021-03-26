import { Command, flags } from '@oclif/command';
import * as path from 'path';
import * as fs from 'fs';
import * as Mustache from 'mustache';

class GenerateGlobalDTs extends Command {
  static description = 'describe the command here';

  static flags = {
    version: flags.version({ char: 'v' }),
    help: flags.help({ char: 'h' }),
  };

  static args = [{ name: 'file', description: 'path to env file. defaults to .env' }];

  async run() {
    const { args } = this.parse(GenerateGlobalDTs);

    const envPath = args.file ?? '.env';

    this.log(`getting variables from ${envPath}`);

    const envVariables = this.getEnvVariables(envPath);

    const filePath = path.join(process.cwd(), 'global.d.ts');

    if (!fs.existsSync(filePath)) {
      fs.writeFileSync(filePath, ``);
    }

    const file = this.renderFile(envVariables);

    fs.writeFileSync(path.resolve(process.cwd(), 'global.d.ts'), file);

    this.log('successfully generated');
  }

  getEnvVariables(envPath: string) {
    const envVariables: string[] = [];

    fs.readFileSync(path.join(process.cwd(), envPath), 'utf-8')
      .split(/\r?\n/)
      .forEach((line: string) => {
        if (line) envVariables.push(line.split('=')[0]);
      });

    return envVariables;
  }

  renderFile(envVariables: string[]) {
    return Mustache.render(this.template(), {
      variables: envVariables
        .filter((e) => e !== 'NODE_ENV' && e !== 'PORT')
        .map((e) => ({ variableName: e })),
    });
  }

  template() {
    return `declare namespace NodeJS {
      interface ProcessEnv {
        NODE_ENV: 'development' | 'test' | 'staging' | 'production';
        PORT: string;
        {{#variables}}
        {{variableName}}: string;
        {{/variables}}
      }
    }
    `;
  }
}

export = GenerateGlobalDTs;
