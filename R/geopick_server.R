library(dplyr)
library(plumber)
pr("geopick_api.R") %>% pr_run(port=8000, host = "0.0.0.0")
