# HappyStreet
Duncan Disciples 


# Setup
cd server && npm install && node server.js
cd app && npm install && npm run dev


# ONLY THING IN /APP THAT SHOULD EVER BE MODIFIED IS app/src/App.jsx
That is our react frontend. Everything frontend on clientside exists there.






# Weird network stuff
New-NetFirewallRule -DisplayName "HappyQuests Server" -Direction Inbound -Protocol TCP -LocalPort 3001 -Action Allow -Profile Private,Public

New-NetFirewallRule -DisplayName "Vite Dev" -Direction Inbound -Protocol TCP -LocalPort 5173 -Action Allow


make sure network is set to priv on windows