FROM node:16-slim

ARG SHOPIFY_API_KEY
ENV SHOPIFY_API_KEY=$SHOPIFY_API_KEY
EXPOSE 8081
WORKDIR /app
COPY web .
RUN npm install
RUN npx prisma generate
RUN npm run build
RUN cd frontend && npm install && npm run build
CMD ["npm", "run", "serve", "--loglevel", "verbose"]
