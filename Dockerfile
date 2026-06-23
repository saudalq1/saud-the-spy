FROM node:18-alpine
COPY ./backend ./backend
WORKDIR /backend
RUN npm install
EXPOSE 3000
CMD ["npm", "start"]