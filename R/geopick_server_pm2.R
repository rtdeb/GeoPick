#!/usr/bin/env Rscript

library(dplyr)
library(plumber)
pr("geopick_api.R") %>% pr_run(port=8000)
