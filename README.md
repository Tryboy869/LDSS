# 🌌 LDSS - Local Distributed Storage System

<div align="center">

![Version](https://img.shields.io/badge/version-0.1.0-blue.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)
![Status](https://img.shields.io/badge/status-experimental-orange.svg)

**Store data in your users' browsers. Zero backend required.**

[Quick Start](#-quick-start) • [Documentation](#-documentation) • [Examples](#-examples) • [Contributing](#-contributing)

</div>

---

## ⚠️ Experimental Release

**LDSS v0.1.0 is an experimental proof-of-concept.**

- ✅ Works in modern browsers (Chrome, Firefox, Safari, Edge)
- ✅ Great for prototypes and personal projects
- ⚠️ API may change in future versions
- ⚠️ Not battle-tested in production yet

**Use at your own risk. Feedback and contributions welcome!**

---

## 🎯 What is LDSS?

LDSS (Local Distributed Storage System) is a JavaScript library that lets you store data directly in your users' browsers using modern web APIs.

### Why LDSS?

- **🚀 Zero Backend** - No servers, no databases, no infrastructure costs
- **💰 Free Forever** - Storage lives in user devices, not your servers
- **🔒 Privacy-First** - Data never leaves the user's device
- **⚡ Blazing Fast** - Direct access to local storage, no network latency
- **📦 Simple API** - Store, retrieve, search - that's it

### Perfect For

- Personal projects and prototypes
- Offline-first applications
- Client-side tools and utilities
- Learning modern web storage APIs
- MVP development without backend

---

## 📦 Installation

### Via NPM

```bash
npm install ldss-client
```

### Via CDN

```html
<script src="https://unpkg.com/ldss-client@0.1.0/ldss-client.js"></script>
```

### Manual Download

Download `ldss-client.js` from [GitHub Releases](https://github.com/Tryboy869/ldss/releases)

---

## 🚀 Quick Start

### 1. Import LDSS

```javascript
// ES6 Module
import LDSS from 'ldss-client';

// CommonJS
const LDSS = require('ldss-client');

// Browser (CDN)
// LDSS is available as window.LDSS
```

### 2. Initialize

```javascript
const db = new LDSS({
  projectName: 'MyAwesomeApp'
});

await db.init();
```

### 3. Store Data

```javascript
await db.store('todos', {
  title: 'Build something amazing',
  done: false
});
```

### 4. Retrieve Data

```javascript
const todos = await db.getAll('todos');
console.log(todos);
```

### Complete Example

```html
<!DOCTYPE html>
<html>
<head>
  <title>LDSS Todo App</title>
</head>
<body>
  <h1>My Todos</h1>
  <input type="text" id="todoInput" placeholder="New todo...">
  <button onclick="addTodo()">Add</button>
  <ul id="todoList"></ul>

  <script src="https://unpkg.com/ldss-client@0.1.0/ldss-client.js"></script>
  <script>
    let db;

    async function initApp() {
      db = new LDSS({ projectName: 'TodoApp' });
      await db.init();
      await loadTodos();
    }

    async function addTodo() {
      const input = document.getElementById('todoInput');
      const title = input.value.trim();
      
      if (!title) return;

      await db.store('todos', {
        title,
        done: false,
        createdAt: Date.now()
      });

      input.value = '';
      await loadTodos();
    }

    async function loadTodos() {
      const todos = await db.getAll('todos');
      const list = document.getElementById('todoList');
      
      list.innerHTML = todos
        .map(todo => `<li>${todo.title}</li>`)
        .join('');
    }

    initApp();
  </script>
</body>
</html>
```

---

## 📚 Documentation

### API Reference

#### `new LDSS(config)`

Create a new LDSS instance.

```javascript
const db = new LDSS({
  projectName: 'MyApp' // Required: Unique name for your app
});
```

**Parameters:**
- `config.projectName` (string, required) - Unique identifier for your application

---

#### `await db.init()`

Initialize LDSS workers. Must be called before any operations.

```javascript
await db.init();
```

**Returns:** Promise<LDSS> - The initialized instance

---

#### `await db.store(collection, data)`

Store data in a collection.

```javascript
await db.store('users', {
  name: 'Alice',
  email: 'alice@example.com'
});
```

**Parameters:**
- `collection` (string) - Collection name
- `data` (object) - Data to store

**Returns:** Promise<{ success: boolean, id: string }>

**Auto-generated fields:**
- `id` - Unique identifier (auto-generated if not provided)
- `_createdAt` - Timestamp when record was created

---

#### `await db.get(collection, id)`

Get a single item by ID.

```javascript
const user = await db.get('users', 'user-123');
console.log(user);
```

**Parameters:**
- `collection` (string) - Collection name
- `id` (string|number) - Item ID

**Returns:** Promise<object|null> - The item or null if not found

---

#### `await db.getAll(collection)`

Get all items from a collection.

```javascript
const allUsers = await db.getAll('users');
console.log(allUsers); // Array of user objects
```

**Parameters:**
- `collection` (string) - Collection name

**Returns:** Promise<Array> - Array of items

---

#### `await db.delete(collection, id)`

Delete an item.

```javascript
await db.delete('users', 'user-123');
```

**Parameters:**
- `collection` (string) - Collection name
- `id` (string|number) - Item ID

**Returns:** Promise<{ success: boolean }>

---

#### `await db.search(query)`

Search across all collections.

```javascript
const results = await db.search('alice');
console.log(results);
// [{ collection: 'users', id: 'user-123', score: 100 }]
```

**Parameters:**
- `query` (string) - Search query

**Returns:** Promise<Array> - Array of search results with scores

**Searchable fields:** title, name, text, content, description

---

#### `await db.clear(collection)`

Clear all data from a collection.

```javascript
await db.clear('todos');
```

**Parameters:**
- `collection` (string) - Collection name

**Returns:** Promise<{ success: boolean }>

---

#### `await db.getStats()`

Get storage statistics.

```javascript
const stats = await db.getStats();
console.log(stats);
/*
{
  version: '0.1.0',
  projectName: 'MyApp',
  collections: 3,
  totalItems: 42,
  searchIndexSize: 42,
  estimatedSize: 43008
}
*/
```

**Returns:** Promise<object> - Storage statistics

---

### Architecture

LDSS v0.1.0 uses 3 specialized workers:

```
┌─────────────────────────────────────┐
│          LDSS Architecture          │
├─────────────────────────────────────┤
│                                     │
│  Worker 1: IndexedDB                │
│  ├─ Primary data storage            │
│  ├─ ~50 MB - 2 GB capacity          │
│  └─ Persistent across sessions      │
│                                     │
│  Worker 2: Cache (localStorage)     │
│  ├─ Fast access cache               │
│  ├─ ~5-10 MB capacity               │
│  └─ TTL-based expiration            │
│                                     │
│  Worker 3: Search (in-memory)       │
│  ├─ Full-text search index          │
│  ├─ Variable size                   │
│  └─ Rebuilt on page load            │
│                                     │
└─────────────────────────────────────┘
```

**Storage Capacity:**
- Total: 50 MB - 2 GB (depends on browser)
- Chrome/Edge: Up to 60% of free disk space
- Firefox: Up to 10% of free disk space
- Safari: Fixed ~1 GB limit

---

## 💡 Examples

### Example 1: Todo App

See [examples/01-todo-app/](examples/01-todo-app/)

### Example 2: Notes App

See [examples/02-notes-app/](examples/02-notes-app/)

### Example 3: Contacts Manager

See [examples/03-contacts-app/](examples/03-contacts-app/)

---

## 🔧 Advanced Usage

### Working with Multiple Collections

```javascript
// Users collection
await db.store('users', { name: 'Alice' });
await db.store('users', { name: 'Bob' });

// Posts collection
await db.store('posts', { title: 'Hello World', author: 'Alice' });
await db.store('posts', { title: 'LDSS is awesome', author: 'Bob' });

// Get all users
const users = await db.getAll('users');

// Get all posts
const posts = await db.getAll('posts');
```

### Custom IDs

```javascript
// Provide your own ID
await db.store('users', {
  id: 'user_alice_2025',
  name: 'Alice'
});

// Retrieve by custom ID
const alice = await db.get('users', 'user_alice_2025');
```

### Search with Auto-Indexing

```javascript
// Store items with searchable fields
await db.store('articles', {
  title: 'Getting Started with LDSS',
  content: 'LDSS is a local storage system...',
  author: 'Anzize'
});

await db.store('articles', {
  title: 'Advanced LDSS Patterns',
  content: 'Learn how to build complex apps...',
  author: 'Anzize'
});

// Search across all articles
const results = await db.search('LDSS');
// Returns articles sorted by relevance
```

### Error Handling

```javascript
try {
  await db.store('users', { name: 'Alice' });
} catch (error) {
  console.error('Failed to store user:', error);
}
```

### Storage Statistics

```javascript
const stats = await db.getStats();
console.log(`
  Project: ${stats.projectName}
  Collections: ${stats.collections}
  Total Items: ${stats.totalItems}
  Search Index: ${stats.searchIndexSize} items
`);
```

---

## 🌐 Browser Support

| Browser | Version | Support |
|---------|---------|---------|
| Chrome | 87+ | ✅ Full |
| Firefox | 78+ | ✅ Full |
| Safari | 14+ | ✅ Full |
| Edge | 87+ | ✅ Full |
| Opera | 73+ | ✅ Full |

**Requirements:**
- IndexedDB support
- localStorage support
- ES6+ JavaScript

---

## 🔒 Privacy & Security

### Data Privacy

- **100% Client-Side**: All data stays in the user's browser
- **No Tracking**: LDSS doesn't send any data to external servers
- **No Analytics**: Zero telemetry or usage tracking
- **User Control**: Users can clear data via browser settings

### Security Considerations

⚠️ **Important:** LDSS stores data in browser storage which is:

- **Not encrypted by default** - Anyone with device access can read it
- **Cleared when user clears browser data**
- **Accessible via browser DevTools**

**For sensitive data:**
- Encrypt before storing (use crypto libraries)
- Don't store passwords or tokens
- Inform users about data persistence

---

## 🛠️ Development

### Building from Source

```bash
# Clone repository
git clone https://github.com/Tryboy869/ldss.git
cd ldss

# No build step required!
# ldss-client.js is ready to use
```

### Testing

```bash
# Open examples in browser
cd examples/01-todo-app
# Open index.html in browser
```

### Running Examples Locally

```bash
# Start a simple HTTP server
python -m http.server 8000

# Open http://localhost:8000/examples/
```

---

## 🗺️ Roadmap

### v0.1.0 (Current) ✅
- [x] Basic CRUD operations
- [x] IndexedDB integration
- [x] Full-text search
- [x] 3 examples

### v0.2.0 (Next)
- [ ] Performance optimizations
- [ ] More examples (5+ apps)
- [ ] Better error messages
- [ ] TypeScript definitions

### v0.3.0 (Future)
- [ ] Reactive queries (RxDB-style)
- [ ] Advanced indexing
- [ ] Data export/import
- [ ] Compression support

### v1.0.0 (Stable)
- [ ] API stability guarantee
- [ ] Production-ready
- [ ] Full documentation
- [ ] Comprehensive tests

**Note:** Roadmap is subject to change based on community feedback.

---

## 🤝 Contributing

Contributions are welcome! This is an experimental project and we'd love your help.

### Ways to Contribute

- 🐛 Report bugs via [GitHub Issues](https://github.com/Tryboy869/ldss/issues)
- 💡 Suggest features
- 📖 Improve documentation
- 🔧 Submit pull requests
- ⭐ Star the project
- 📢 Share with others

### Development Setup

1. Fork the repository
2. Create a feature branch: `git checkout -b my-feature`
3. Make your changes
4. Test with examples
5. Submit a pull request

### Code Style

- Use clear variable names
- Add comments for complex logic
- Keep functions small and focused
- Follow existing code patterns

---

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details.

Copyright (c) 2025 Daouda Abdoul Anzize / Nexus Studio

---

## 👤 Author

**Daouda Abdoul Anzize**
- Company: [Nexus Studio](mailto:nexusstudio100@gmail.com)
- GitHub: [@Tryboy869](https://github.com/Tryboy869)
- Email: anzizdaouda0@gmail.com

---

## 🙏 Acknowledgments

- Inspired by modern web storage APIs
- Built with modern JavaScript
- No external dependencies (just browser APIs)

---

## ⚡ Performance Tips

### 1. Batch Operations

```javascript
// Bad: Multiple individual stores
for (const item of items) {
  await db.store('items', item);
}

// Better: Batch processing
const promises = items.map(item => db.store('items', item));
await Promise.all(promises);
```

### 2. Use Specific Collections

```javascript
// Bad: Everything in one collection
await db.store('data', { type: 'user', name: 'Alice' });
await db.store('data', { type: 'post', title: 'Hello' });

// Better: Separate collections
await db.store('users', { name: 'Alice' });
await db.store('posts', { title: 'Hello' });
```

### 3. Limit Search Scope

```javascript
// Instead of searching everything:
const results = await db.search('query');

// Get specific collection first:
const posts = await db.getAll('posts');
const filtered = posts.filter(p => p.title.includes('query'));
```

---

## 🐛 Troubleshooting

### Issue: "Not initialized" error

```javascript
// ❌ Wrong
const db = new LDSS({ projectName: 'MyApp' });
await db.store('items', { name: 'test' }); // Error!

// ✅ Correct
const db = new LDSS({ projectName: 'MyApp' });
await db.init(); // Must call init first!
await db.store('items', { name: 'test' });
```

### Issue: Data disappears after page refresh

LDSS uses IndexedDB which persists data. If data disappears:

1. Check browser's private/incognito mode (doesn't persist)
2. Verify `projectName` is consistent
3. Check browser storage settings
4. Look for quota exceeded errors in console

### Issue: Search not finding items

Search only indexes these fields:
- title
- name
- text
- content
- description

```javascript
// ❌ Won't be searchable
await db.store('items', { label: 'Important' });

// ✅ Will be searchable
await db.store('items', { title: 'Important' });
```

---

## 📊 FAQ

### Q: Is LDSS production-ready?

**A:** Not yet. v0.1.0 is experimental. Use for prototypes and personal projects. Wait for v1.0.0 for production use.

### Q: How much data can I store?

**A:** Depends on the browser:
- Chrome/Edge: Up to 60% of free disk space
- Firefox: Up to 10% of free disk space  
- Safari: ~1 GB fixed limit

### Q: Can I use LDSS with React/Vue/Angular?

**A:** Yes! LDSS is framework-agnostic. Just import and use.

### Q: Does LDSS work offline?

**A:** Yes! All data is stored locally. No internet required after initial page load.

### Q: Can I sync data between devices?

**A:** Not in v0.1.0. Each device has its own isolated storage. Sync features may come in future versions.

### Q: Is data encrypted?

**A:** No. Data is stored in plain text in IndexedDB. Encrypt sensitive data before storing.

### Q: Can I export/backup data?

**A:** Not built-in yet. You can implement your own export:

```javascript
const allData = await db.getAll('collection');
const json = JSON.stringify(allData);
// Download or send to your backend
```

### Q: What happens if user clears browser data?

**A:** All LDSS data is deleted. This is standard browser behavior. Inform users about data persistence.

---

## 🔗 Links

- **GitHub**: https://github.com/Tryboy869/ldss
- **NPM**: https://www.npmjs.com/package/ldss-client
- **Issues**: https://github.com/Tryboy869/ldss/issues
- **Discussions**: https://github.com/Tryboy869/ldss/discussions

---

## 💬 Community

Have questions or want to chat?

- Open a [GitHub Discussion](https://github.com/Tryboy869/ldss/discussions)
- Report bugs via [GitHub Issues](https://github.com/Tryboy869/ldss/issues)
- Email: nexusstudio100@gmail.com

---

<div align="center">

**Made with ❤️ by [Nexus Studio](mailto:nexusstudio100@gmail.com)**

⭐ Star us on [GitHub](https://github.com/Tryboy869/ldss) if you find LDSS useful!

</div>