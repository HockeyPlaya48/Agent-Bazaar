#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import inquirer from 'inquirer';
import fs from 'fs-extra';
import path from 'path';
import { searchSkills, installSkill, buildAgent, listSkills, getAnalytics } from './commands';

const program = new Command();

program
  .name('agentbazaar')
  .description('Official CLI for Agent Bazaar - discover, install, and manage AI skills')
  .version('0.1.0');

// Search command
program
  .command('search <query>')
  .description('Search skills in Agent Bazaar')
  .option('-c, --category <category>', 'Filter by category')
  .option('-t, --type <type>', 'Filter by type (api|cli|skill)')
  .option('-l, --limit <number>', 'Limit number of results', '10')
  .action(async (query, options) => {
    const spinner = ora('Searching Agent Bazaar...').start();
    
    try {
      const results = await searchSkills(query, options);
      spinner.stop();
      
      if (results.length === 0) {
        console.log(chalk.yellow(`No skills found matching "${query}"`));
        return;
      }
      
      console.log(chalk.green(`\n🔍 Found ${results.length} skills:\n`));
      
      results.forEach((skill, index) => {
        console.log(`${chalk.cyan(`${index + 1}.`)} ${chalk.bold(skill.name)}`);
        console.log(`   ${chalk.gray(skill.description)}`);
        console.log(`   ${chalk.blue(`$${skill.pricePerCall}/call`)} • ${chalk.magenta(skill.category)} • ${skill.type.toUpperCase()}`);
        console.log(`   ${chalk.dim(`agentbazaar install ${skill.slug}`)}\n`);
      });
    } catch (error) {
      spinner.fail('Search failed');
      console.error(chalk.red(error instanceof Error ? error.message : String(error)));
    }
  });

// Install command
program
  .command('install <slug>')
  .description('Download skill configuration to local project')
  .option('-d, --dir <directory>', 'Installation directory', './skills')
  .option('-f, --format <format>', 'Config format (yaml|json|env)', 'yaml')
  .action(async (slug, options) => {
    const spinner = ora(`Installing ${slug}...`).start();
    
    try {
      const config = await installSkill(slug, options);
      spinner.stop();
      
      console.log(chalk.green(`✅ ${config.name} installed successfully!`));
      console.log(chalk.gray(`   Config saved to: ${options.dir}/${slug}.${options.format}`));
      console.log(chalk.gray(`   Endpoint: ${config.x402Endpoint}`));
      console.log(chalk.gray(`   Cost: $${config.pricePerCall}/call`));
      
      // Show usage example
      console.log(chalk.blue('\n📘 Usage:'));
      console.log(`   curl -X POST ${config.x402Endpoint} \\`);
      console.log(`     -H "X-402-Payment: demo" \\`);
      console.log(`     -H "Content-Type: application/json" \\`);
      console.log(`     -d '{"input": "your_data_here"}'`);
    } catch (error) {
      spinner.fail('Installation failed');
      console.error(chalk.red(error instanceof Error ? error.message : String(error)));
    }
  });

// Build command
program
  .command('build')
  .description('Build an AI agent using Agent Bazaar skills')
  .option('-d, --description <description>', 'Agent description')
  .option('-n, --name <name>', 'Agent name')
  .option('-p, --platforms <platforms>', 'Target platforms (comma-separated)', 'telegram,email')
  .option('-o, --output <directory>', 'Output directory', './agent')
  .action(async (options) => {
    let description = options.description;
    
    if (!description) {
      const answers = await inquirer.prompt([
        {
          type: 'input',
          name: 'description',
          message: 'What should your agent do?',
          validate: (input) => input.length > 0 || 'Description is required'
        }
      ]);
      description = answers.description;
    }
    
    const spinner = ora('AI is building your agent...').start();
    
    try {
      const agent = await buildAgent({
        description,
        name: options.name,
        platforms: options.platforms.split(',').map((p: string) => p.trim())
      });
      
      spinner.stop();
      
      // Create output directory
      await fs.ensureDir(options.output);
      
      // Write agent files
      await fs.writeFile(path.join(options.output, 'SOUL.md'), agent.soul_md);
      await fs.writeFile(path.join(options.output, 'AGENTS.md'), agent.agents_md);
      await fs.writeFile(path.join(options.output, 'TOOLS.md'), agent.tools_md);
      await fs.writeFile(path.join(options.output, 'setup.md'), agent.setup_instructions);
      
      if (agent.cron_jobs && agent.cron_jobs.length > 0) {
        const cronConfig = agent.cron_jobs.map((job: any) => `# ${job.name}\n${job.schedule} ${job.task}`).join('\n\n');
        await fs.writeFile(path.join(options.output, 'cron.txt'), cronConfig);
      }
      
      console.log(chalk.green(`🤖 ${agent.name} created successfully!`));
      console.log(chalk.gray(`   Files saved to: ${options.output}/`));
      console.log(chalk.gray(`   Estimated monthly cost: ${agent.estimated_monthly_cost}`));
      console.log(chalk.gray(`   Skills integrated: ${agent.skills_used}`));
      
      if (agent.recommended_skills && agent.recommended_skills.length > 0) {
        console.log(chalk.blue('\n🛠️  Recommended Skills:'));
        agent.recommended_skills.forEach((skill: any) => {
          console.log(`   • ${skill.name} - ${skill.why}`);
        });
      }
      
      console.log(chalk.yellow('\n🚀 Next steps:'));
      console.log(`   cd ${options.output}`);
      console.log(`   openclaw gateway start`);
      
    } catch (error) {
      spinner.fail('Agent building failed');
      console.error(chalk.red(error instanceof Error ? error.message : String(error)));
    }
  });

// List command
program
  .command('list')
  .description('List all available skills')
  .option('-c, --category <category>', 'Filter by category')
  .option('-t, --type <type>', 'Filter by type (api|cli|skill)')
  .option('--featured', 'Show only featured skills')
  .action(async (options) => {
    const spinner = ora('Loading skills...').start();
    
    try {
      const skills = await listSkills(options);
      spinner.stop();
      
      console.log(chalk.green(`\n📋 ${skills.length} skills available:\n`));
      
      const categories = [...new Set(skills.map(s => s.category))].sort();
      
      categories.forEach(category => {
        const categorySkills = skills.filter(s => s.category === category);
        console.log(chalk.bold.magenta(`${category.toUpperCase()} (${categorySkills.length})`));
        
        categorySkills.forEach(skill => {
          const badge = skill.featured ? chalk.yellow('⭐') : '';
          console.log(`  ${badge} ${skill.name} - ${chalk.blue(`$${skill.pricePerCall}`)} - ${chalk.dim(skill.slug)}`);
        });
        console.log();
      });
      
      console.log(chalk.gray('Use `agentbazaar search <query>` to find specific skills'));
      console.log(chalk.gray('Use `agentbazaar install <slug>` to download a skill'));
    } catch (error) {
      spinner.fail('Failed to load skills');
      console.error(chalk.red(error instanceof Error ? error.message : String(error)));
    }
  });

// Analytics command
program
  .command('analytics')
  .description('Show free analytics for your skills')
  .option('-w, --wallet <address>', 'Wallet address to analyze')
  .action(async (options) => {
    let walletAddress = options.wallet;
    
    if (!walletAddress) {
      walletAddress = process.env.BAZAAR_WALLET_ADDRESS;
    }
    
    if (!walletAddress) {
      const answers = await inquirer.prompt([
        {
          type: 'input',
          name: 'wallet',
          message: 'Enter your wallet address:',
          validate: (input) => input.startsWith('0x') || 'Invalid wallet address'
        }
      ]);
      walletAddress = answers.wallet;
    }
    
    const spinner = ora('Fetching analytics...').start();
    
    try {
      const analytics = await getAnalytics(walletAddress);
      spinner.stop();
      
      console.log(chalk.green(`\n📊 Analytics for ${walletAddress.slice(0, 8)}...${walletAddress.slice(-6)}\n`));
      
      console.log(`${chalk.bold('Total Calls:')} ${chalk.cyan(analytics.totalCalls)}`);
      console.log(`${chalk.bold('Revenue Earned:')} ${chalk.green(`$${analytics.revenue.toFixed(2)}`)}`);
      console.log(`${chalk.bold('Avg Response Time:')} ${chalk.yellow(`${analytics.avgLatency}ms`)}`);
      console.log(`${chalk.bold('Success Rate:')} ${chalk.green(`${analytics.successRate}%`)}`);
      
      if (analytics.topSkills && analytics.topSkills.length > 0) {
        console.log(chalk.bold('\n🏆 Top Skills:'));
        analytics.topSkills.forEach((skill, index) => {
          console.log(`  ${index + 1}. ${skill.name} - ${skill.calls} calls - ${chalk.green(`$${skill.revenue.toFixed(2)}`)}`);
        });
      }
      
      console.log(chalk.gray('\nFull dashboard: https://agent-bazaar.com/analytics'));
    } catch (error) {
      spinner.fail('Analytics failed');
      console.error(chalk.red(error instanceof Error ? error.message : String(error)));
    }
  });

// Global error handling
process.on('unhandledRejection', (error) => {
  console.error(chalk.red('Unhandled error:'), error);
  process.exit(1);
});

program.parse();