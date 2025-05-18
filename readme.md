#### About

emplate-api is an open-source project specifically designed to simplify and accelerate the development of API systems.

#### Feature

- router using decorator
- middleware using decorator
- Basic auth using jwt
- RBAC (role base action control)
- request validator
- using typeorm
- clustering

#### Geting Start

1. clone this repository
2. install depedency:
   `npm run install`
3. make file .env copy value from .env.example
4. create database template-api or etc
5. migrate base table:
   `npm run migrate:run`
6. running apps
   `npm run dev`
7. If you add or modify an entity, simply run:
   `npm run migrate:generate` and `npm run migrate:start`
8. open api docs
   `http://localhost:3000/api-docs`
