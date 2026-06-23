FROM node:lts-alpine
USER node
ENV HOME=/home/node PATH=/home/node/.local/bin:$PATH
WORKDIR $HOME/app
COPY --chown=node . $HOME/app
RUN npm install
EXPOSE 4000
ENTRYPOINT ["node", "./server.js"]