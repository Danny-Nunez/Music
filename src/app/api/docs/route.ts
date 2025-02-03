import { NextResponse } from 'next/server';

const apiDocs = {
  openapi: '3.0.0',
  info: {
    title: 'Music API',
    version: '1.0.0',
    description: 'API documentation for the Music application',
  },
  paths: {
    '/api/playlists': {
      get: {
        summary: 'Get all playlists',
        responses: {
          '200': {
            description: 'List of playlists',
            content: {
              'application/json': {
                schema: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      id: { type: 'string' },
                      name: { type: 'string' },
                      userId: { type: 'string' },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    '/api/search': {
      get: {
        summary: 'Search for music',
        parameters: [
          {
            name: 'q',
            in: 'query',
            description: 'Search query',
            required: true,
            schema: {
              type: 'string',
            },
          },
        ],
        responses: {
          '200': {
            description: 'Search results',
          },
        },
      },
    },
    '/api/videos': {
      get: {
        summary: 'Get videos',
        responses: {
          '200': {
            description: 'List of videos',
          },
        },
      },
    },
  },
};

export async function GET() {
  return NextResponse.json(apiDocs);
}
