/**
 * AI Quality Validation Test Framework
 * Tests AI code modification quality on various repository types
 */

import { describe, it, expect } from "vitest";
import { analyzeAndModifyCode } from "../server/codeModificationService";

interface TestRepository {
  name: string;
  description: string;
  size: "small" | "medium" | "large";
  complexity: "low" | "medium" | "high";
  files: Array<{
    path: string;
    content: string;
    language: string;
  }>;
  testCases: Array<{
    description: string;
    changeRequest: string;
    expectedFiles: string[];
    successCriteria: string[];
  }>;
}

/**
 * Repository Gauntlet - 20 test repositories covering various scenarios
 */
const repositoryGauntlet: TestRepository[] = [
  // Small, Simple Repositories (1-5 files)
  {
    name: "simple-todo-app",
    description: "Basic todo list with React",
    size: "small",
    complexity: "low",
    files: [
      {
        path: "src/App.tsx",
        content: `import React, { useState } from 'react';

function App() {
  const [todos, setTodos] = useState<string[]>([]);
  const [input, setInput] = useState('');

  const addTodo = () => {
    if (input.trim()) {
      setTodos([...todos, input]);
      setInput('');
    }
  };

  return (
    <div>
      <h1>Todo List</h1>
      <input value={input} onChange={(e) => setInput(e.target.value)} />
      <button onClick={addTodo}>Add</button>
      <ul>
        {todos.map((todo, i) => <li key={i}>{todo}</li>)}
      </ul>
    </div>
  );
}

export default App;`,
        language: "typescript",
      },
    ],
    testCases: [
      {
        description: "Add delete functionality",
        changeRequest: "Add a delete button next to each todo item",
        expectedFiles: ["src/App.tsx"],
        successCriteria: [
          "Delete button added",
          "Delete handler implemented",
          "Existing add functionality preserved",
          "State management intact",
        ],
      },
    ],
  },

  // Medium Complexity (6-15 files)
  {
    name: "express-api-server",
    description: "Express REST API with routes",
    size: "medium",
    complexity: "medium",
    files: [
      {
        path: "src/index.ts",
        content: `import express from 'express';
import userRoutes from './routes/users';

const app = express();
app.use(express.json());
app.use('/api/users', userRoutes);

app.listen(3000, () => console.log('Server running'));`,
        language: "typescript",
      },
      {
        path: "src/routes/users.ts",
        content: `import { Router } from 'express';

const router = Router();

router.get('/', (req, res) => {
  res.json({ users: [] });
});

router.post('/', (req, res) => {
  res.json({ success: true });
});

export default router;`,
        language: "typescript",
      },
    ],
    testCases: [
      {
        description: "Add authentication middleware",
        changeRequest: "Add JWT authentication middleware to protect user routes",
        expectedFiles: ["src/middleware/auth.ts", "src/routes/users.ts"],
        successCriteria: [
          "Auth middleware created",
          "Applied to protected routes",
          "Existing routes preserved",
          "Error handling added",
        ],
      },
    ],
  },

  // Large, Complex (16+ files)
  {
    name: "ecommerce-platform",
    description: "Full e-commerce with products, cart, checkout",
    size: "large",
    complexity: "high",
    files: [
      {
        path: "src/components/ProductList.tsx",
        content: `import React from 'react';
import { Product } from '../types';

interface Props {
  products: Product[];
  onAddToCart: (id: string) => void;
}

export function ProductList({ products, onAddToCart }: Props) {
  return (
    <div className="grid">
      {products.map(p => (
        <div key={p.id}>
          <h3>{p.name}</h3>
          <p>${p.price}</p>
          <button onClick={() => onAddToCart(p.id)}>Add to Cart</button>
        </div>
      ))}
    </div>
  );
}`,
        language: "typescript",
      },
      {
        path: "src/types/index.ts",
        content: `export interface Product {
  id: string;
  name: string;
  price: number;
  description: string;
}

export interface CartItem {
  productId: string;
  quantity: number;
}`,
        language: "typescript",
      },
    ],
    testCases: [
      {
        description: "Add product filtering",
        changeRequest: "Add category filter dropdown to ProductList",
        expectedFiles: ["src/components/ProductList.tsx"],
        successCriteria: [
          "Filter dropdown added",
          "Filtering logic implemented",
          "Existing add to cart preserved",
          "Props interface updated if needed",
        ],
      },
    ],
  },
];

describe("AI Quality Validation - Repository Gauntlet", () => {
  // Test each repository
  for (const repo of repositoryGauntlet.slice(0, 3)) {
    // Start with 3 repos for demo
    describe(`Repository: ${repo.name}`, () => {
      for (const testCase of repo.testCases) {
        it(`should ${testCase.description}`, async () => {
          const result = await analyzeAndModifyCode(
            {
              description: testCase.changeRequest,
              files: repo.files,
              repoName: repo.name,
            },
            { userId: 1, projectId: 1 }
          );

          // Verify expected files are modified
          expect(result.filesToModify.length).toBeGreaterThan(0);
          for (const expectedFile of testCase.expectedFiles) {
            expect(result.filesToModify).toContain(expectedFile);
          }

          // Verify changes were generated
          expect(result.changes.length).toBeGreaterThan(0);

          // Verify each change has content and explanation
          for (const change of result.changes) {
            expect(change.content).toBeTruthy();
            expect(change.content.length).toBeGreaterThan(50);
            expect(change.explanation).toBeTruthy();
          }

          // Log results for manual review
          console.log(`\n=== Test: ${testCase.description} ===`);
          console.log(`Files modified: ${result.filesToModify.join(", ")}`);
          console.log(`Summary: ${result.summary}`);
          console.log(`Success criteria to verify:`);
          testCase.successCriteria.forEach((criteria, i) => {
            console.log(`  ${i + 1}. ${criteria}`);
          });
        }, 60000); // 60s timeout for AI calls
      }
    });
  }
});

/**
 * Export for manual testing
 */
export { repositoryGauntlet };
