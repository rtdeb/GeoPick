# Script to launch the server for the API

#!/usr/bin/env Rscript

library(dplyr)
library(plumber)

df.env <- read.table("../.env", sep = "=") %>% setNames(., c("var", "value"))
port <- as.integer(df.env[df.env$var == "PORT", "value"])
host <- df.env[df.env$var == "HOST", "value"]

pr("geopick_api.R") %>% pr_run(port = port, host = host)
