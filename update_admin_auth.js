const fs = require('fs');
const path = require('path');

function walk(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    isDirectory ? walk(dirPath, callback) : callback(path.join(dir, f));
  });
}

walk('src/app/api/admin', function(filePath) {
  if (filePath.endsWith('.ts') || filePath.endsWith('.tsx')) {
    let content = fs.readFileSync(filePath, 'utf8');
    let original = content;
    
    if (content.includes('isAdminSessionValid(') && !content.includes('await isAdminSessionValid(')) {
      content = content.replace(/isAdminSessionValid\(/g, 'await isAdminSessionValid(');
      content = content.replace(/const\s+adminUser\s*=\s*ADMIN_IDENTITY;?/g, '');
      content = content.replace(/adminUser\.permissions/g, "['all']");
      
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`Updated ${filePath}`);
    }
  }
});
