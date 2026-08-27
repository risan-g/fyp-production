const http = require('http');

const server = http.createServer((req, res) => {
  res.setHeader('Content-Type', 'application/json');

  if (req.url === '/api/token' && req.method === 'POST') {
    res.end(JSON.stringify({
      access_token: 'mock-access-token',
      token_type: 'Bearer',
      expires_in: 3600
    }));
    return;
  }

  // Mock artist data
  if (req.url.startsWith('/v1/artists/0Y5tJX1MQlPlqiwlOH1tJY')) {
    if (req.url.includes('/albums')) {
      res.end(JSON.stringify({
        items: [{
          id: 'mock-album-id',
          name: 'Rodeo',
          release_date: '2015-09-04',
          total_tracks: 1,
          artists: [{ id: '0Y5tJX1MQlPlqiwlOH1tJY', name: 'Travis Scott' }],
          images: [{ url: 'mock-image.jpg' }]
        }]
      }));
      return;
    }
    res.end(JSON.stringify({
      id: '0Y5tJX1MQlPlqiwlOH1tJY',
      name: 'Travis Scott',
      images: [{ url: 'mock-image.jpg' }],
      followers: { total: 1000 },
      genres: ['rap']
    }));
    return;
  }

  if (req.url.startsWith('/v1/search')) {
    const url = new URL(req.url, `http://${req.headers.host}`);
    const query = url.searchParams.get('q') || '';
    if (query.toLowerCase().includes('travis')) {
      res.end(JSON.stringify({
        artists: { items: [{ id: '0Y5tJX1MQlPlqiwlOH1tJY', name: 'Travis Scott', images: [{ url: 'mock-image.jpg' }] }] },
        albums: { items: [] }
      }));
      return;
    }
    if (query.toLowerCase().includes('rodeo')) {
      res.end(JSON.stringify({
        artists: { items: [] },
        albums: { items: [{ id: 'mock-album-id', name: 'Rodeo', artists: [{ id: '0Y5tJX1MQlPlqiwlOH1tJY', name: 'Travis Scott' }], images: [{ url: 'mock-image.jpg' }] }] }
      }));
      return;
    }
    res.end(JSON.stringify({
      artists: { items: [] },
      albums: { items: [] }
    }));
    return;
  }

  // General fallback for albums
  if (req.url.startsWith('/v1/albums/')) {
    res.end(JSON.stringify({
      id: 'mock-album-id',
      name: 'Rodeo',
      release_date: '2015-09-04',
      total_tracks: 1,
      images: [{ url: 'mock-image.jpg' }],
      artists: [{ id: '0Y5tJX1MQlPlqiwlOH1tJY', name: 'Travis Scott' }],
      tracks: {
        items: [{
          id: 'mock-track',
          name: 'Pornography',
          duration_ms: 200000,
          explicit: true,
          artists: [{ id: '0Y5tJX1MQlPlqiwlOH1tJY', name: 'Travis Scott' }]
        }]
      }
    }));
    return;
  }

  if (req.url.startsWith('/v1/artists/')) {
    res.end(JSON.stringify({
      id: 'mock-id',
      name: 'Mock Artist',
      images: [{ url: 'mock-image.jpg' }],
      followers: { total: 1000 },
      genres: ['rap']
    }));
    return;
  }

  res.statusCode = 404;
  res.end(JSON.stringify({ error: 'Not found' }));
});

const PORT = 3001;
server.listen(PORT, '127.0.0.1', () => {
  console.log(`Fixture server listening on 127.0.0.1:${PORT}`);
});
