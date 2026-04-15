package main

import (
	"dms/bootstrap"
)

func main() {
	app := bootstrap.Boot()

	app.Start()
}
