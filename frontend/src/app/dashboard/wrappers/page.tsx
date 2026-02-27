"use client";

import { useState } from "react";
import { Copy, Check, Code, Zap, ExternalLink } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FadeInUp, StaggerContainer, StaggerItem } from "@/components/motion";

const TEMPLATES = {
  nextjs: {
    name: "Next.js",
    icon: "⚡",
    description: "App Router API route with x402",
    template: (apiUrl: string, price: string) => `import { withX402 } from '@agent-bazaar/x402-sdk';

export const POST = withX402({
  price: ${price},
  handler: async (req) => {
    // Your API logic here
    const body = await req.json();
    
    // Make your API call
    const response = await fetch('${apiUrl}', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });
    
    const result = await response.json();
    return Response.json(result);
  }
});

// Optional: GET method for health checks
export const GET = () => {
  return Response.json({ 
    status: 'online',
    price: ${price},
    endpoint: '${apiUrl}'
  });
};`
  },
  python: {
    name: "Python",
    icon: "🐍", 
    description: "Flask/FastAPI wrapper with x402",
    template: (apiUrl: string, price: string) => `from flask import Flask, request, jsonify
import requests
from x402_sdk import require_payment

app = Flask(__name__)

@app.route('/api/wrapper', methods=['POST'])
@require_payment(price=${price})
def wrapper():
    """x402-enabled wrapper for ${apiUrl}"""
    try:
        # Get request data
        data = request.get_json()
        
        # Forward to your API
        response = requests.post(
            '${apiUrl}',
            json=data,
            headers={'Content-Type': 'application/json'}
        )
        response.raise_for_status()
        
        return jsonify(response.json())
        
    except requests.exceptions.RequestException as e:
        return jsonify({'error': str(e)}), 500
    except Exception as e:
        return jsonify({'error': 'Internal server error'}), 500

@app.route('/health', methods=['GET'])
def health():
    return jsonify({
        'status': 'online',
        'price': ${price},
        'endpoint': '${apiUrl}'
    })

if __name__ == '__main__':
    app.run(debug=True)`
  },
  nodejs: {
    name: "Node.js",
    icon: "🟢",
    description: "Express.js server with x402",
    template: (apiUrl: string, price: string) => `const express = require('express');
const axios = require('axios');
const { withX402 } = require('@agent-bazaar/x402-sdk');

const app = express();
app.use(express.json());

// x402-enabled endpoint
app.post('/api/wrapper', withX402({ price: ${price} }), async (req, res) => {
  try {
    // Forward request to your API
    const response = await axios.post('${apiUrl}', req.body, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    res.json(response.data);
    
  } catch (error) {
    console.error('API Error:', error.message);
    res.status(500).json({
      error: error.response?.data?.error || 'Internal server error'
    });
  }
});

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'online',
    price: ${price},
    endpoint: '${apiUrl}'
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(\`x402 wrapper server running on port \${PORT}\`);
});`
  },
  go: {
    name: "Go",
    icon: "🐹",
    description: "Gin web framework with x402",
    template: (apiUrl: string, price: string) => `package main

import (
    "bytes"
    "encoding/json"
    "io"
    "net/http"
    
    "github.com/gin-gonic/gin"
    "github.com/agent-bazaar/x402-go"
)

type WrapperRequest struct {
    // Define your request structure here
    Data interface{} \`json:"data"\`
}

type WrapperResponse struct {
    // Define your response structure here  
    Result interface{} \`json:"result"\`
    Error  string      \`json:"error,omitempty"\`
}

func main() {
    r := gin.Default()
    
    // x402-enabled endpoint
    r.POST("/api/wrapper", x402.WithPayment(${price}), func(c *gin.Context) {
        var req WrapperRequest
        if err := c.ShouldBindJSON(&req); err != nil {
            c.JSON(400, WrapperResponse{Error: "Invalid request"})
            return
        }
        
        // Forward to your API
        jsonData, _ := json.Marshal(req)
        resp, err := http.Post("${apiUrl}", "application/json", bytes.NewBuffer(jsonData))
        if err != nil {
            c.JSON(500, WrapperResponse{Error: err.Error()})
            return
        }
        defer resp.Body.Close()
        
        body, err := io.ReadAll(resp.Body)
        if err != nil {
            c.JSON(500, WrapperResponse{Error: "Failed to read response"})
            return
        }
        
        var result interface{}
        json.Unmarshal(body, &result)
        c.JSON(200, WrapperResponse{Result: result})
    })
    
    // Health check
    r.GET("/health", func(c *gin.Context) {
        c.JSON(200, gin.H{
            "status":   "online",
            "price":    ${price},
            "endpoint": "${apiUrl}",
        })
    })
    
    r.Run(":8080")
}`
  },
  curl: {
    name: "cURL",
    icon: "🌐",
    description: "Command-line examples",
    template: (apiUrl: string, price: string) => `# Test your x402-enabled endpoint

# 1. Health check (free)
curl -X GET \\
  "https://your-wrapper.com/health" \\
  -H "Content-Type: application/json"

# 2. Make a paid API call via x402
curl -X POST \\
  "https://your-wrapper.com/api/wrapper" \\
  -H "Content-Type: application/json" \\
  -H "X-402-Price: ${price}" \\
  -H "Authorization: Bearer YOUR_X402_TOKEN" \\
  -d '{
    "your_data": "here"
  }'

# 3. Direct call to original API (for comparison)
curl -X POST \\
  "${apiUrl}" \\
  -H "Content-Type: application/json" \\
  -d '{
    "your_data": "here"
  }'

# Note: Replace YOUR_X402_TOKEN with your actual token
# Get tokens at: https://agentbazaar.xyz/tokens`
  }
};

export default function WrappersPage() {
  const [selectedTab, setSelectedTab] = useState<keyof typeof TEMPLATES>("nextjs");
  const [apiUrl, setApiUrl] = useState("https://api.yourservice.com/endpoint");
  const [price, setPrice] = useState("0.05");
  const [copied, setCopied] = useState(false);

  const currentTemplate = TEMPLATES[selectedTab];
  const generatedCode = currentTemplate.template(apiUrl, price);

  const copyCode = () => {
    navigator.clipboard.writeText(generatedCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="mx-auto max-w-6xl px-6 py-8">
      <FadeInUp>
        <div className="flex items-center gap-3 mb-2">
          <h1 className="text-3xl font-bold">x402 Wrapper Generator</h1>
          <Badge variant="atlas">
            <div className="flex items-center gap-1">
              <Zap size={12} />
              Live
            </div>
          </Badge>
        </div>
        <p className="text-zinc-400">
          Transform any API into an x402-enabled service. Generate production-ready wrapper code in seconds.
        </p>
      </FadeInUp>

      {/* What is x402 */}
      <FadeInUp className="mt-8">
        <Card className="bg-gradient-to-br from-orange-500/5 to-orange-600/5 border-orange-500/20">
          <div className="flex items-start gap-4">
            <div className="p-2 rounded-lg bg-orange-500/20">
              <Zap size={20} className="text-orange-400" />
            </div>
            <div>
              <h3 className="font-semibold text-orange-300 mb-2">What is x402?</h3>
              <p className="text-sm text-zinc-300 mb-3">
                x402 is the HTTP-native payment protocol that enables agents to pay for API calls automatically. 
                No setup, no API keys to manage — just wrap your endpoint and start earning.
              </p>
              <div className="flex items-center gap-4 text-sm text-orange-400">
                <span>💰 Instant payments</span>
                <span>🤖 Agent-native</span>
                <span>⚡ Sub-second latency</span>
              </div>
            </div>
          </div>
        </Card>
      </FadeInUp>

      {/* Configuration */}
      <StaggerContainer className="mt-10 grid gap-6 lg:grid-cols-3">
        <StaggerItem className="lg:col-span-1">
          <Card>
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <Code size={16} />
              Configuration
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">
                  Your API Endpoint
                </label>
                <input
                  type="url"
                  value={apiUrl}
                  onChange={(e) => setApiUrl(e.target.value)}
                  className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-sm focus:border-orange-500 focus:outline-none"
                  placeholder="https://api.yourservice.com/endpoint"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">
                  Price per Call ($)
                </label>
                <input
                  type="number"
                  step="0.001"
                  min="0.001"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-sm focus:border-orange-500 focus:outline-none"
                  placeholder="0.05"
                />
              </div>
              
              <div className="pt-4 border-t border-zinc-800">
                <div className="text-xs text-zinc-500 space-y-1">
                  <div>• Price is charged per successful call</div>
                  <div>• Failed calls are not charged</div>
                  <div>• Minimum price: $0.001</div>
                </div>
              </div>
            </div>
          </Card>
        </StaggerItem>

        <StaggerItem className="lg:col-span-2">
          <Card>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold">Generated Code</h3>
              <Button
                onClick={copyCode}
                size="sm"
                className="flex items-center gap-2"
              >
                {copied ? <Check size={14} /> : <Copy size={14} />}
                {copied ? "Copied!" : "Copy Code"}
              </Button>
            </div>
            
            {/* Language Tabs */}
            <div className="flex gap-2 mb-4 overflow-x-auto">
              {Object.entries(TEMPLATES).map(([key, template]) => (
                <button
                  key={key}
                  onClick={() => setSelectedTab(key as keyof typeof TEMPLATES)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                    selectedTab === key
                      ? "bg-orange-500/20 text-orange-300 border border-orange-500/30"
                      : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-zinc-300"
                  }`}
                >
                  <span>{template.icon}</span>
                  {template.name}
                </button>
              ))}
            </div>
            
            <div className="mb-2 text-sm text-zinc-400">
              {currentTemplate.description}
            </div>
            
            {/* Code Block */}
            <div className="relative">
              <pre className="bg-zinc-950 border border-zinc-800 rounded-lg p-4 text-sm overflow-x-auto">
                <code className="text-zinc-300">{generatedCode}</code>
              </pre>
            </div>
          </Card>
        </StaggerItem>
      </StaggerContainer>

      {/* Next Steps */}
      <FadeInUp className="mt-10">
        <Card>
          <h3 className="font-semibold mb-4">Next Steps</h3>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-orange-500/20 text-orange-400 text-xs font-bold flex items-center justify-center">1</div>
                <div>
                  <p className="font-medium">Deploy Your Wrapper</p>
                  <p className="text-sm text-zinc-400">Copy the generated code and deploy to Vercel, Railway, or your preferred platform.</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-orange-500/20 text-orange-400 text-xs font-bold flex items-center justify-center">2</div>
                <div>
                  <p className="font-medium">Test the Endpoint</p>
                  <p className="text-sm text-zinc-400">Verify your wrapper works correctly before listing it on Agent Bazaar.</p>
                </div>
              </div>
            </div>
            
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-orange-500/20 text-orange-400 text-xs font-bold flex items-center justify-center">3</div>
                <div>
                  <p className="font-medium">List on Agent Bazaar</p>
                  <p className="text-sm text-zinc-400">Add your x402-enabled API to the bazaar to start earning from agent usage.</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-orange-500/20 text-orange-400 text-xs font-bold flex items-center justify-center">4</div>
                <div>
                  <p className="font-medium">Monitor & Optimize</p>
                  <p className="text-sm text-zinc-400">Use the Provider Dashboard to track usage, earnings, and optimize pricing.</p>
                </div>
              </div>
            </div>
          </div>
          
          <div className="flex gap-3 mt-6">
            <a 
              href="/dev" 
              className="inline-flex items-center justify-center gap-2 rounded-full font-medium transition-all duration-200 bg-orange-500 text-white hover:bg-orange-400 hover:shadow-[0_0_24px_rgba(249,115,22,0.3)] px-5 py-2.5 text-sm"
            >
              List My API
              <ExternalLink size={14} />
            </a>
            <a 
              href="/docs/x402" 
              className="inline-flex items-center justify-center gap-2 rounded-full font-medium transition-all duration-200 border border-zinc-700 bg-zinc-900 text-zinc-300 hover:bg-zinc-800 hover:border-zinc-600 px-5 py-2.5 text-sm"
            >
              x402 Documentation
              <ExternalLink size={14} />
            </a>
          </div>
        </Card>
      </FadeInUp>
    </div>
  );
}