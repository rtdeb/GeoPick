#!/usr/bin/env Rscript

# Script to launch the server for the API

library(dplyr)
library(plumber)

df.env <- read.table("../.env", sep = "=") %>% setNames(., c("var", "value"))
port <- as.integer(as.character((df.env[df.env$var == "PORT", "value"]))
host <- as.character(df.env[df.env$var == "HOST", "value"])

pr("geopick_api.R") %>% pr_run(port = port, host = host)
