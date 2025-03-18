# 1. Start with a PyTorch Docker image
FROM nvidia/cuda:12.4.0-devel-ubuntu22.04 AS base

# 2. Install Rust
RUN apt-get update  \
    && apt-get install -y curl dav1d libaom-dev libpq-dev pkg-config unzip  \
    && apt-get clean  \
    && curl https://sh.rustup.rs -sSf | sh -s -- -y
ENV PATH="/root/.cargo/bin:${PATH}"

# 3. Download a matching libtorch release (optional if you prefer to use the one from the PyTorch image)
RUN curl -LO https://download.pytorch.org/libtorch/cu124/libtorch-cxx11-abi-shared-with-deps-2.6.0%2Bcu124.zip \
    && unzip libtorch-cxx11-abi-shared-with-deps-2.6.0%2Bcu124.zip -d /opt \
    && rm libtorch-cxx11-abi-shared-with-deps-2.6.0%2Bcu124.zip

ENV LIBTORCH=/opt/libtorch
ENV LD_LIBRARY_PATH=/opt/libtorch/lib:$LD_LIBRARY_PATH
ENV PKG_CONFIG_PATH=/usr/lib/x86_64-linux-gnu/pkgconfig

# 4. Copy your Rust project and build it
WORKDIR /tagging_service
RUN cargo init
COPY db_service /db_service
COPY tagging_service/Cargo.toml /tagging_service/Cargo.toml
RUN cargo fetch
COPY tagging_service /tagging_service

FROM base AS development

CMD [ "cargo", "run" ]
