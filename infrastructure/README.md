# Infrastructure setup

## Docker

We use docker compose to store the database, to start this up use:

```bash
docker compose up -docker
```

## PyTorch

For the pytorch install, we'll use a Python environment

```bash
python -m venv libtorch
# active venv using your OS
pip install torch --index-url https://download.pytorch.org/whl/cu124
```
