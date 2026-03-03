# agentbazaar CLI

> Official command-line tool for Agent Bazaar - discover, install, and manage AI skills

## Installation

```bash
# Install globally
npm install -g agentbazaar

# Or use with npx
npx agentbazaar --help
```

## Commands

### Search Skills

Find skills by query, category, or type:

```bash
# Search all skills
agentbazaar search "web scraping"

# Filter by category
agentbazaar search "crypto" --category trading

# Filter by type
agentbazaar search "automation" --type cli

# Limit results
agentbazaar search "image" --limit 5
```

### Install Skills

Download skill configurations to your project:

```bash
# Install to ./skills/ (default)
agentbazaar install web-scraper

# Custom directory and format
agentbazaar install web-scraper --dir ./my-skills --format json

# Environment file format
agentbazaar install crypto-oracle --format env
```

Supported formats:
- `yaml` (default) - YAML configuration
- `json` - JSON configuration  
- `env` - Environment variables

### Build Agents

Generate complete AI agent configurations:

```bash
# Interactive mode
agentbazaar build

# Direct command
agentbazaar build --description "Create a crypto trading bot that monitors prices and executes trades"

# With options
agentbazaar build \
  --description "Content creation agent for social media" \
  --name "ContentBot" \
  --platforms "twitter,instagram" \
  --output ./my-agent
```

Generated files:
- `SOUL.md` - Agent personality and core values
- `AGENTS.md` - Mission, memory management, tools
- `TOOLS.md` - Agent Bazaar skills integration
- `setup.md` - Step-by-step setup instructions
- `cron.txt` - Scheduled tasks (if applicable)

### List All Skills

Browse the complete marketplace:

```bash
# All skills
agentbazaar list

# By category
agentbazaar list --category automation

# Featured only
agentbazaar list --featured

# CLI tools only
agentbazaar list --type cli
```

### Analytics

View free analytics for your skills:

```bash
# Specify wallet
agentbazaar analytics --wallet 0x1234...

# Use environment variable
export BAZAAR_WALLET_ADDRESS="0x1234..."
agentbazaar analytics
```

Shows:
- Total calls across all your skills
- Revenue earned
- Average response time
- Success rate
- Top performing skills

## Configuration

### Environment Variables

```bash
# Optional - default analytics wallet
export BAZAAR_WALLET_ADDRESS="0x1234..."

# Optional - custom endpoint  
export BAZAAR_BASE_URL="https://agent-bazaar.com"
```

## Examples

### Quick Skill Test

```bash
# Search and install
agentbazaar search "web search"
agentbazaar install web-search-skill

# Test with curl
curl -X POST https://agent-bazaar.com/api/x402/web-search \
  -H "X-402-Payment: demo" \
  -H "Content-Type: application/json" \
  -d '{"query": "AI agents", "limit": 3}'
```

### Create a Trading Agent

```bash
# Build the agent
agentbazaar build --description "Cryptocurrency trading agent that monitors prices, analyzes trends, and executes trades based on technical indicators"

# Navigate to generated files
cd ./agent
ls -la

# Start with OpenClaw
openclaw gateway start
```

### Project Integration

```bash
# Install skills for your project
mkdir my-ai-project && cd my-ai-project

# Install multiple skills
agentbazaar install web-scraper --format yaml
agentbazaar install code-review --format yaml  
agentbazaar install crypto-oracle --format yaml

# Use in your code
cat skills/web-scraper.yaml
```

## Development

### Local Testing

```bash
git clone https://github.com/agent-bazaar/cli
cd cli
npm install
npm run dev search "test query"
```

### Building

```bash
npm run build
./bin/cli.js --help
```

## Support

- **Website**: [agent-bazaar.com](https://agent-bazaar.com)
- **Documentation**: [agent-bazaar.com/docs/cli](https://agent-bazaar.com/docs/cli)
- **Issues**: [GitHub Issues](https://github.com/agent-bazaar/cli/issues)
- **Discord**: [Agent Bazaar Community](https://discord.gg/agent-bazaar)

## License

MIT - Free for commercial and personal use.