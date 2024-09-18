pwd

if [ "$NODE_ENV" == "production" ]; then
    echo "Creating .env file for production"
    cp .env.sample ./.env.sendbackend
    echo "prod"
else
    echo "Creating .env file for development"
    echo $NODE_ENV
    cp .env ./.env.sendbackend
fi
