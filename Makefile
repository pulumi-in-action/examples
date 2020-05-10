.DEFAULT_GOAL := all

all: ensure up destroy

ensure:
	./scripts/ensure.sh

up:
	./scripts/up.sh

destroy:
	./scripts/destroy.sh
