FROM node:18-alpine
COPY ./backend ./backend
WORKDIR /backend
RUN npm install
EXPOSE 7860
CMD ["npm", "start"]