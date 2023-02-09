FROM node:18-slim

ARG SHOPIFY_API_KEY
ENV SHOPIFY_API_KEY=$SHOPIFY_API_KEY
EXPOSE 8081
WORKDIR /app
COPY web .
RUN npm install
RUN npm run build
RUN cd frontend && npm install && npm run build
CMD ["npm", "run", "serve"]
