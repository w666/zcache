# YAKV - Yet Another Key-Value Store

YAKV is very simple storage that is designed to solve one simple problem - managing external lock for relational databases.
Databases engines implement locks in some way, but it is quite complex work to manage such locks, sometimes existing locks mechanism are not suitable for moderns applications.

YAKV consists of two modules:

-   KV storage that can be used as a local in-memory store
-   Web server to access KV storage over RESTful API

## Features

-   Keys can be strings or number
-   Value can be anything
-   Global TTL (expire time)
-   Per-key TTL (expire time)
-   RESTful API
-   Key can't be replaced until expired

## Local Storage

## RESTful API
