FROM node:alpine
WORKDIR /usr/app
COPY ./ ./
RUN npm install
# ENV MONGO_URI = ''
CMD ["node","index.js"]
EXPOSE 5000
