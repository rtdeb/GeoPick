library(dplyr)
library(plumber)
pr("grt-api.R") %>% pr_run(host='0.0.0.0',port=8000)

