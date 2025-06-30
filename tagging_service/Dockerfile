# 1. Start with a PyTorch Docker image
FROM nvidia/cuda:12.4.1-cudnn-devel-ubuntu22.04 AS base

# 2. Install Rust
RUN apt-get update  \
    && apt-get install -y curl libpq-dev pkg-config unzip  \
    && apt-get clean  \
    && curl https://sh.rustup.rs -sSf | sh -s -- -y
ENV PATH="/root/.cargo/bin:${PATH}"

ENV PKG_CONFIG_PATH=/usr/lib/x86_64-linux-gnu/pkgconfig

# 4. Copy your Rust project and build it
WORKDIR /tagging_service
RUN cargo init
COPY db_service /db_service
COPY tagging_service/Cargo.toml /tagging_service/Cargo.toml
RUN cargo fetch
COPY tagging_service /tagging_service

FROM base AS development

CMD [ "cargo", "run", "--release" ]
