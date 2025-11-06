import { getProjectFiles } from "./db";

interface GeneratedFile {
  id: number;
  projectId: number;
  filePath: string;
  content: string;
  language: string | null;
  createdAt: Date;
}

/**
 * Generate a preview HTML page that bundles all generated files
 * This creates a self-contained HTML page with embedded CSS and JS
 */
export async function generatePreviewHTML(projectId: number): Promise<string> {
  const files = await getProjectFiles(projectId);
  
  if (files.length === 0) {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Preview - No Files</title>
          <style>
            body {
              margin: 0;
              padding: 0;
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              display: flex;
              align-items: center;
              justify-content: center;
              min-height: 100vh;
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              color: white;
            }
            .message {
              text-align: center;
              padding: 2rem;
            }
            h1 { font-size: 2rem; margin-bottom: 1rem; }
            p { font-size: 1.1rem; opacity: 0.9; }
          </style>
        </head>
        <body>
          <div class="message">
            <h1>No Files Generated Yet</h1>
            <p>Generate code for this project to see a preview</p>
          </div>
        </body>
      </html>
    `;
  }

  // Find the main HTML file (index.html or similar)
  const htmlFile = files.find(f => 
    f.filePath.toLowerCase().includes('index.html') || 
    f.filePath.toLowerCase().endsWith('.html')
  );

  // If there's an HTML file, use it as the base
  if (htmlFile) {
    return injectFilesIntoHTML(htmlFile.content, files);
  }

  // Otherwise, create a React app preview
  return generateReactPreview(files);
}

/**
 * Inject CSS and JS files into an existing HTML file
 */
function injectFilesIntoHTML(htmlContent: string, files: GeneratedFile[]): string {
  let modifiedHTML = htmlContent;

  // Find all CSS files
  const cssFiles = files.filter(f => 
    f.filePath.endsWith('.css') && 
    !f.filePath.includes('node_modules')
  );

  // Find all JS files (excluding node_modules and config files)
  const jsFiles = files.filter(f => 
    (f.filePath.endsWith('.js') || f.filePath.endsWith('.jsx')) &&
    !f.filePath.includes('node_modules') &&
    !f.filePath.includes('config') &&
    !f.filePath.includes('vite') &&
    !f.filePath.includes('tailwind')
  );

  // Inject CSS
  let cssContent = '';
  for (const cssFile of cssFiles) {
    cssContent += `\n/* ${cssFile.filePath} */\n${cssFile.content}\n`;
  }

  if (cssContent) {
    const styleTag = `<style>${cssContent}</style>`;
    if (modifiedHTML.includes('</head>')) {
      modifiedHTML = modifiedHTML.replace('</head>', `${styleTag}\n</head>`);
    } else {
      modifiedHTML = `<head>${styleTag}</head>` + modifiedHTML;
    }
  }

  // Inject JS
  let jsContent = '';
  for (const jsFile of jsFiles) {
    jsContent += `\n/* ${jsFile.filePath} */\n${jsFile.content}\n`;
  }

  if (jsContent) {
    const scriptTag = `<script type="module">${jsContent}</script>`;
    if (modifiedHTML.includes('</body>')) {
      modifiedHTML = modifiedHTML.replace('</body>', `${scriptTag}\n</body>`);
    } else {
      modifiedHTML += scriptTag;
    }
  }

  return modifiedHTML;
}

/**
 * Generate a preview for React/TypeScript projects
 */
function generateReactPreview(files: GeneratedFile[]): string {
  // Find the main App component
  const appFile = files.find(f => 
    f.filePath.includes('App.tsx') || 
    f.filePath.includes('App.jsx') ||
    f.filePath.includes('app.tsx') ||
    f.filePath.includes('app.jsx')
  );

  // Find CSS files
  const cssFiles = files.filter(f => f.filePath.endsWith('.css'));
  let cssContent = '';
  for (const cssFile of cssFiles) {
    cssContent += `\n/* ${cssFile.filePath} */\n${cssFile.content}\n`;
  }

  // Create a simple preview HTML
  return `
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Preview</title>
        <style>
          ${cssContent}
          
          /* Default styles if no CSS provided */
          body {
            margin: 0;
            padding: 0;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          }
        </style>
        <script src="https://unpkg.com/react@18/umd/react.production.min.js"></script>
        <script src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js"></script>
        <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
      </head>
      <body>
        <div id="root"></div>
        
        <div style="padding: 2rem; text-align: center; color: #666;">
          <h2>Preview Mode</h2>
          <p>This is a simplified preview of your React application.</p>
          <p>For full functionality, deploy your application or run it locally.</p>
          <div style="margin-top: 2rem; padding: 1rem; background: #f5f5f5; border-radius: 8px;">
            <h3>Generated Files (${files.length})</h3>
            <ul style="list-style: none; padding: 0;">
              ${files.slice(0, 10).map(f => `<li style="padding: 0.25rem;">📄 ${f.filePath}</li>`).join('')}
              ${files.length > 10 ? `<li style="padding: 0.25rem;">... and ${files.length - 10} more</li>` : ''}
            </ul>
          </div>
        </div>

        ${appFile ? `
        <script type="text/babel">
          // Simplified version of the app
          ${appFile.content.replace(/import .* from .*[;'"]/g, '// import removed for preview')}
        </script>
        ` : ''}
      </body>
    </html>
  `;
}

/**
 * Get preview URL for a project
 */
export function getPreviewUrl(projectId: number, baseUrl: string): string {
  return `${baseUrl}/api/preview/${projectId}`;
}
