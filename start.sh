#!/bin/bash


# Install all dependencies (including missing ones)
npm install @headlessui/react react-hot-toast @supabase/supabase-js react-icons idb

# Install the rest from package.json
npm install

# Start the development server
npm run dev