pwd

if [ "$NODE_ENV" == "production" ]; then
    echo "Creating .env file for production"
    cp .env.sample ./.env.local
    echo "prod"
else
    echo "Creating .env file for development"
    echo $NODE_ENV
    cp .env ./.env.local
fi
