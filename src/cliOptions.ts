import { Command, Option } from 'commander';

function portParser(value: string): number {
  const port = parseInt(value, 10);

  // Validate the port number
  if (isNaN(port) || port < 1 || port > 65535) {
    throw new Error(`Invalid port number: ${value}. Port must be between 1 and 65535.`);
  }

  return port;
}

export interface CliOptions {
  port: number;
  logLevel: string;
}

export function parseCliOptions(): CliOptions {
  const program = new Command();

  program
    .addOption(new Option('-p, --port <number>', 'port number')
      .argParser(portParser) // Use the custom port parser
      .env('PORT') // Allow the port to be set via the PORT environment variable
      .default(3000)) // Default port is 3000
    .addOption(
      new Option('-l, --log-level <level>', 'set the minimum log level')
        .choices(['error', 'warn', 'info', 'debug']) // Only allow these values
        .default('info') // Default log level is 'info'
    )
    .parse(process.argv);

  const args = program.opts();

  if (args.help !== undefined) {
    program.help();
  }

  return {
    port: args.port,
    logLevel: args.logLevel,
  };
}
